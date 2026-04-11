// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Document, Packer, Paragraph, HeadingLevel } from "https://esm.sh/docx@9.0.0";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function runApify(actorId: string, input: Record<string, unknown>) {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${APIFY_TOKEN}&waitForFinish=60`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!runRes.ok) throw new Error("Apify run failed");
  const runData = await runRes.json();
  const datasetId = runData?.data?.defaultDatasetId;
  return { runData, datasetId };
}

async function fetchDatasetItems(datasetId: string) {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&limit=100`
  );
  if (!res.ok) return [];
  return await res.json();
}

async function callClaude(prompt: string, data: any) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      messages: [
        { role: "user", content: `${prompt}\n\nDATA:\n${JSON.stringify(data).slice(0, 200000)}` },
      ],
    }),
  });
  if (!res.ok) throw new Error("Claude API failed");
  const out = await res.json();
  const text = out?.content?.[0]?.text ?? "";
  return text;
}

function toCsv(rows: any[]) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const vals = headers.map((h) => JSON.stringify(row[h] ?? ""));
    lines.push(vals.join(","));
  }
  return lines.join("\n");
}

async function uploadOutput(jobId: string, userId: string, filename: string, bytes: Uint8Array, type: string) {
  const path = `${userId}/${jobId}/${filename}`;
  const { error } = await supabase.storage.from("outputs").upload(path, bytes, { upsert: true, contentType: type });
  if (error) throw error;
  await supabase.from("job_outputs").insert({
    job_id: jobId,
    type: filename.endsWith(".pdf") ? "pdf" : filename.endsWith(".docx") ? "docx" : "csv",
    storage_path: path,
    metadata: {},
  });
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(jwt);
    const userId = userData?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const { type, input } = await req.json();
    if (!type || !input) return jsonResponse({ error: "Invalid payload" }, 400);

    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .insert({ user_id: userId, type, status: "running", input_json: input })
      .select("id")
      .single();
    if (jobError || !jobRow?.id) return jsonResponse({ error: "Job create failed" }, 500);

    const jobId = jobRow.id;
    await supabase.from("job_runs").insert({ job_id: jobId, stage: "started" });

    // Actor selection (fallback to Google Search)
    let actorId = "apify/google-search-scraper";
    if (type === "travel") actorId = "apify/google-search-scraper";
    if (type === "competitor") actorId = "apify/google-search-scraper";
    if (type === "job") actorId = "apify/google-search-scraper";

    const query = input?.message || input?.role || "search";
    const { runData, datasetId } = await runApify(actorId, { queries: [String(query)], maxResults: 50 });
    if (datasetId) {
      await supabase.from("apify_runs").insert({
        job_id: jobId,
        actor_id: actorId,
        dataset_id: datasetId,
        stats: runData?.data ?? {},
      });
    }
    const items = datasetId ? await fetchDatasetItems(datasetId) : [];

    const prompt = `You are an expert analyst. Produce a JSON object with keys:
report (string),
rows (array of objects for CSV),
doc_sections (array of {title, body}).
Use the user's input to tailor results and include actionable details.`;
    const claudeText = await callClaude(prompt, { input, items });

    let parsed: any = { report: claudeText, rows: [], doc_sections: [] };
    try {
      parsed = JSON.parse(claudeText);
    } catch {
      // keep fallback
    }

    const csv = toCsv(parsed.rows ?? []);
    const csvBytes = new TextEncoder().encode(csv);
    await uploadOutput(jobId, userId, "output.csv", csvBytes, "text/csv");

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "HandyScrapper Report", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: parsed.report ?? "" }),
            ...(parsed.doc_sections ?? []).flatMap((s: any) => [
              new Paragraph({ text: s.title ?? "", heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: s.body ?? "" }),
            ]),
          ],
        },
      ],
    });
    const docxBytes = await Packer.toBuffer(doc);
    await uploadOutput(
      jobId,
      userId,
      "output.docx",
      new Uint8Array(docxBytes),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(parsed.report ?? "", { x: 50, y: page.getHeight() - 70, font, size: 12, maxWidth: 500 });
    const pdfBytes = await pdfDoc.save();
    await uploadOutput(jobId, userId, "output.pdf", pdfBytes, "application/pdf");

    await supabase.from("jobs").update({ status: "done" }).eq("id", jobId);
    await supabase.from("job_runs").insert({ job_id: jobId, stage: "finished", finished_at: new Date().toISOString() });

    return jsonResponse({ jobId });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
