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
const email = process.argv[2];

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email) {
  console.error("Usage: node scripts/delete_user_data.cjs <email>");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (userErr) throw userErr;
  const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("User not found");

  const userId = user.id;

  // gather job ids
  const { data: jobs } = await supabase.from("jobs").select("id").eq("user_id", userId);
  const jobIds = (jobs || []).map((j) => j.id);

  if (jobIds.length) {
    await supabase.from("job_outputs").delete().in("job_id", jobIds);
    await supabase.from("job_runs").delete().in("job_id", jobIds);
    await supabase.from("apify_runs").delete().in("job_id", jobIds);
    await supabase.from("jobs").delete().in("id", jobIds);
  }

  await supabase.from("job_results").delete().eq("user_id", userId);
  await supabase.from("job_searches").delete().eq("user_id", userId);
  await supabase.from("competitor_reports").delete().eq("user_id", userId);
  await supabase.from("travel_plans").delete().eq("user_id", userId);
  await supabase.from("activity_log").delete().eq("user_id", userId);
  await supabase.from("usage_events").delete().eq("user_id", userId);
  await supabase.from("billing_invoices").delete().eq("user_id", userId);
  await supabase.from("billing_profile").delete().eq("user_id", userId);
  await supabase.from("api_keys").delete().eq("user_id", userId);
  await supabase.from("user_settings").delete().eq("user_id", userId);
  await supabase.from("profiles").delete().eq("id", userId);

  // storage cleanup (best-effort)
  const buckets = ["inputs", "outputs", "resumes"];
  for (const bucket of buckets) {
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }
  }

  console.log(`Deleted data for user ${email} (${userId}).`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
