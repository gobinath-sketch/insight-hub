import { createClient } from "@supabase/supabase-js";
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import Anthropic from "@anthropic-ai/sdk";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

function loadEnv() {
  try {
    const envText = readFileSync(join(process.cwd(), ".env"), "utf8");
    envText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // ignore
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE;
const APIFY_TOKEN = process.env.APIFY_TOKEN || process.env.VITE_APIFY_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const TMP = join(ROOT, ".tmp");
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function logRun(jobId, stage, logs, error = null) {
  await supabase.from("job_runs").insert({
    job_id: jobId,
    stage,
    logs,
    error,
  });
}

async function setStatus(jobId, status) {
  await supabase.from("jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", jobId);
}

async function callClaude(system, user) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
  });
  const content = (message?.content || [])
    .map((c) => (typeof c.text === "string" ? c.text : ""))
    .join("\n")
    .trim();
  return content;
}

async function runApifyGoogleSearch(queries) {
  if (!APIFY_TOKEN) {
    throw new Error("Missing APIFY_TOKEN");
  }
  const payload = {
    queries: Array.isArray(queries) ? queries.join("\n") : queries,
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
    languageCode: "en",
    mobileResults: false,
    countryCode: "us",
  };
  const url = `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify error: ${res.status} ${text}`);
  }
  return await res.json();
}

async function extractResumeText(paths = []) {
  const texts = [];
  for (const path of paths) {
    const lower = path.toLowerCase();
    const { data, error } = await supabase.storage.from("inputs").download(path);
    if (error || !data) continue;
    const buffer = Buffer.from(await data.arrayBuffer());
    try {
      if (lower.endsWith(".pdf")) {
        const parsed = await pdfParse(buffer);
        if (parsed?.text) texts.push(parsed.text);
      } else if (lower.endsWith(".docx")) {
        const parsed = await mammoth.extractRawText({ buffer });
        if (parsed?.value) texts.push(parsed.value);
      } else {
        texts.push(buffer.toString("utf8"));
      }
    } catch {
      // ignore
    }
  }
  return texts.join("\n").slice(0, 12000);
}

function buildQueries(type, input) {
  if (type === "job") {
    const role = input?.role || "jobs";
    const location = input?.location || "near me";
    return [
      `${role} jobs ${location} site:linkedin.com`,
      `${role} jobs ${location} site:indeed.com`,
      `${role} jobs ${location} site:glassdoor.com`,
      `${role} jobs ${location} site:wellfound.com`,
      `${role} jobs ${location} site:remoteok.com`,
    ];
  }
  if (type === "competitor") {
    const urls = input?.urls || [];
    return urls.length ? urls.map((u) => `site:${u.replace(/^https?:\/\//, "")}`) : ["competitor pricing page"];
  }
  if (type === "travel") {
    const destination = input?.destination || "travel";
    return [
      `${destination} attractions`,
      `${destination} restaurants`,
      `${destination} hotels`,
      `${destination} hidden gems`,
      `${destination} itinerary`,
    ];
  }
  return [input?.message || "research"];
}

function loadSkillIndex() {
  try {
    const roots = [
      join(process.cwd(), "Skills", "skills-main", "skills-main"),
      join(process.cwd(), "Skills", "agent-skills-main"),
      join(process.cwd(), "Skills", "awesome-agent-skills-main"),
      join(process.cwd(), "Skills", "awesome-claude-code-main"),
      join(process.cwd(), "Skills", "awesome-claude-prompts-main"),
      join(process.cwd(), "Skills", "awesome-skills-main"),
    ];

    const chunks = [];
    for (const root of roots) {
      const readmePath = join(root, "README.md");
      if (existsSync(readmePath)) {
        const text = readFileSync(readmePath, "utf8");
        chunks.push(`# ${root}\n${text.slice(0, 6000)}`);
      }
      const skillsDir = join(root, "skills");
      if (existsSync(skillsDir)) {
        const names = readFileSync(
          join(skillsDir, "..", "README.md"),
          "utf8"
        );
        chunks.push(names.slice(0, 4000));
      }
    }
    return { names: [], docs: chunks.join("\n\n").slice(0, 20000) };
  } catch {
    return { names: [], docs: "" };
  }
}

async function generateOutputs(jobId, reportText, csvRows) {
  const csv = ["title,link,summary", ...csvRows].join("\n");
  const csvPath = join(TMP, `${jobId}.csv`);
  writeFileSync(csvPath, csv, "utf8");

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "HandyScrapper Report", heading: HeadingLevel.HEADING_1 }),
          ...reportText.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] })),
        ],
      },
    ],
  });
  const docxBuffer = await Packer.toBuffer(doc);
  const docxPath = join(TMP, `${jobId}.docx`);
  writeFileSync(docxPath, docxBuffer);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lines = reportText.split("\n");
  let y = 800;
  for (const line of lines) {
    const safe = line.replace(/[^\x00-\x7F]/g, "-");
    page.drawText(safe.slice(0, 120), { x: 40, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= 14;
    if (y < 40) break;
  }
  const pdfBytes = await pdfDoc.save();
  const pdfPath = join(TMP, `${jobId}.pdf`);
  writeFileSync(pdfPath, pdfBytes);

  return { csvPath, docxPath, pdfPath };
}

async function uploadOutput(userId, jobId, type, filePath) {
  const fileName = `${userId}/${jobId}/${type}.${type}`;
  const buffer = readFileSync(filePath);
  const { error: uploadError } = await supabase.storage.from("outputs").upload(fileName, buffer, { upsert: true });
  if (uploadError) {
    throw uploadError;
  }
  await supabase.from("job_outputs").insert({
    job_id: jobId,
    type,
    storage_path: fileName,
  });
}

async function processJob(job) {
  await setStatus(job.id, "processing");
  await logRun(job.id, "start", "Job picked up");

  const skillIndex = loadSkillIndex();
  const resumeFiles = job.input_json?.files || [];
  const resumeText = await extractResumeText(resumeFiles);
  const queries = buildQueries(job.type, job.input_json || {});
  await logRun(job.id, "queries", JSON.stringify(queries));

  const searchResults = await runApifyGoogleSearch(queries);
  await supabase.from("apify_runs").insert({
    job_id: job.id,
    actor_id: "apify/google-search-scraper",
    dataset_id: "inline",
    stats: { results: searchResults.length },
  });

  const compact = searchResults.slice(0, 20).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));

  const system =
    "You are HandyScrapper. Use the provided skills index to guide how you process tasks. " +
    "Return a concise report and a CSV-friendly list of 10 items. " +
    "Always include actionable links in the CSV when available.";
  const resumeNote = !resumeFiles.length
    ? "No resume file was attached."
    : resumeText
      ? "Resume text extracted successfully."
      : "Resume file attached but text extraction failed (possibly scanned PDF).";

  const user =
    `Job type: ${job.type}\n` +
    `Input: ${JSON.stringify(job.input_json)}\n` +
    `Resume text (if any): ${resumeText || "N/A"}\n` +
    `Resume status: ${resumeNote}\n` +
    `Skills Index: ${skillIndex.docs || "No skills index found."}\n` +
    `Results: ${JSON.stringify(compact)}\n` +
    "Output format:\nREPORT:\n<text>\nCSV:\n<rows with title,link,summary>";
  const output = await callClaude(system, user);
  const [reportPart, csvPart] = output.split("CSV:");
  let reportText = (reportPart || output).replace("REPORT:", "").trim();
  let csvRows = (csvPart || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);

  if (!reportText) {
    reportText = compact.map((r) => `- ${r.title}: ${r.url}`).join("\n");
  }
  if (!csvRows.length) {
    csvRows = compact.map((r) => `${r.title},${r.url},${(r.description || "").replace(/,/g, " ")}`).slice(0, 10);
  }

  await logRun(job.id, "report", reportText.slice(0, 8000));
  const files = await generateOutputs(job.id, reportText, csvRows);
  if (!job.user_id) throw new Error("Missing user_id on job");
  await uploadOutput(job.user_id, job.id, "csv", files.csvPath);
  await uploadOutput(job.user_id, job.id, "docx", files.docxPath);
  await uploadOutput(job.user_id, job.id, "pdf", files.pdfPath);

  if (job.type === "job") {
    const userId = job.user_id;
    if (userId) {
      const { data: searchRow } = await supabase
        .from("job_searches")
        .insert({
          user_id: userId,
          role: job.input_json?.role || "",
          location: job.input_json?.location || "",
          work_type: job.input_json?.workType || "any",
          min_salary: job.input_json?.minSalary || "",
          resume_path: (job.input_json?.files || [])[0] || null,
        })
        .select("id")
        .single();
      if (searchRow?.id) {
        const rows = csvRows.map((row) => {
          const parts = row.split(",");
          const title = parts[0]?.trim() || "Job";
          const link = parts[1]?.trim() || "";
          const summary = parts.slice(2).join(",").trim();
          return {
            user_id: userId,
            search_id: searchRow.id,
            title,
            company: "",
            location: job.input_json?.location || "",
            salary: job.input_json?.minSalary || "",
            match_score: 80,
            source: link ? "apify" : "web",
            remote: (job.input_json?.workType || "").toString().toLowerCase() === "remote",
            missing_skills: [],
            why_fit: summary,
            posted: "Recent",
          };
        });
        if (rows.length) {
          await supabase.from("job_results").insert(rows);
        }
      }
    }
  }

  if (job.type === "competitor") {
    const userId = job.user_id;
    if (userId) {
      const name = (job.input_json?.urls || []).join(", ") || "Competitor";
      await supabase.from("competitor_reports").insert({
        user_id: userId,
        name,
        url: name,
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        pricing: [],
        signals: csvRows.slice(0, 4).map((r) => r.split(",")[0]?.trim()).filter(Boolean),
        positioning: reportText.slice(0, 600),
        direction: "See report for details.",
      });
    }
  }

  if (job.type === "travel") {
    const userId = job.user_id;
    if (userId) {
      const itinerary = [
        {
          day: 1,
          title: "Arrival + Highlights",
          activities: csvRows.slice(0, 2).map((r, i) => ({
            time: i === 0 ? "10:00" : "15:00",
            activity: r.split(",")[0]?.trim() || "Explore",
            type: "attraction",
            cost: "TBD",
            tip: "From Apify results",
          })),
          weather: "Sunny",
        },
        {
          day: 2,
          title: "Local Experiences",
          activities: csvRows.slice(2, 4).map((r, i) => ({
            time: i === 0 ? "11:00" : "18:00",
            activity: r.split(",")[0]?.trim() || "Discover",
            type: "food",
            cost: "TBD",
            tip: "From Apify results",
          })),
          weather: "Sunny",
        },
      ];
      await supabase.from("travel_plans").insert({
        user_id: userId,
        destination: job.input_json?.destination || "Trip",
        dates: job.input_json?.dates || "",
        budget: job.input_json?.budget || "",
        travelers: job.input_json?.travelers || "1",
        travel_style: job.input_json?.travelStyle || "balanced",
        pace: job.input_json?.pace || "moderate",
        interests: job.input_json?.interests || "",
        itinerary,
        budget_breakdown: [],
        packing_list: [],
      });
    }
  }

  if (existsSync(files.csvPath)) unlinkSync(files.csvPath);
  if (existsSync(files.docxPath)) unlinkSync(files.docxPath);
  if (existsSync(files.pdfPath)) unlinkSync(files.pdfPath);

  await setStatus(job.id, "completed");
  await logRun(job.id, "done", "Job completed");
}

async function loop() {
  console.log("HandyScrapper worker started");
  while (true) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id,type,status,input_json,created_at,user_id")
      .eq("status", "submitted")
      .order("created_at", { ascending: true })
      .limit(3);

    for (const job of jobs ?? []) {
      try {
        await processJob(job);
      } catch (err) {
        await setStatus(job.id, "failed");
        await logRun(job.id, "error", "Failed", err instanceof Error ? err.message : "Unknown error");
      }
    }
    await sleep(5000);
  }
}

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
