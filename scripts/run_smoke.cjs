const { createClient } = require("@supabase/supabase-js");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) return;
    const envText = readFileSync(envPath, "utf8");
    envText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {}
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function insertJob(type, input_json) {
  const { data: user } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const userId = user?.users?.[0]?.id;
  if (!userId) throw new Error("No users found in auth. Please sign up once.");
  const { data, error } = await supabase
    .from("jobs")
    .insert({ user_id: userId, type, status: "submitted", input_json })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function waitForCompletion(jobId, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.from("jobs").select("status").eq("id", jobId).single();
    if (data?.status === "completed") return true;
    if (data?.status === "failed") return false;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

async function outputsFor(jobId) {
  const { data } = await supabase.from("job_outputs").select("type,storage_path").eq("job_id", jobId);
  return data ?? [];
}

async function run() {
  const jobIds = [];
  jobIds.push(await insertJob("handy", { message: "Find top 5 jobs for a frontend developer in Bangalore." }));
  jobIds.push(await insertJob("job", { role: "Developer", location: "Bangalore", workType: "remote", minSalary: "100000" }));
  jobIds.push(await insertJob("competitor", { urls: ["https://notion.so", "https://airtable.com"] }));
  jobIds.push(await insertJob("travel", { destination: "Goa", dates: "May 1-5", budget: "800", travelers: "2" }));

  for (const id of jobIds) {
    const ok = await waitForCompletion(id);
    const outs = await outputsFor(id);
    console.log(`${id}: ${ok ? "completed" : "failed/timeout"} outputs=${outs.length}`);
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
