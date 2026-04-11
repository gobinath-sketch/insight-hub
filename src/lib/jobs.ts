import { supabase, supabaseEnabled } from "@/lib/supabaseClient";

export type JobType = "job" | "competitor" | "travel" | "handy";

export type JobRow = {
  id: string;
  type: JobType;
  status: string;
  input_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type JobOutput = {
  id: string;
  type: "pdf" | "docx" | "csv";
  storage_path: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function uploadInputs(userId: string, files: File[]) {
  if (!supabaseEnabled || !supabase) return [];
  const paths: string[] = [];
  for (const file of files) {
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("inputs").upload(path, file, { upsert: true });
    if (error) {
      throw error;
    }
    paths.push(path);
  }
  return paths;
}

export async function createJob(type: JobType, input: Record<string, unknown>) {
  if (!supabaseEnabled || !supabase) throw new Error("Supabase not configured");
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("jobs")
    .insert({ user_id: userId, type, status: "submitted", input_json: input })
    .select("id")
    .single();
  if (error || !data?.id) throw error ?? new Error("Job insert failed");
  return { jobId: data.id };
}

export async function listJobs(type?: JobType) {
  if (!supabaseEnabled || !supabase) return [];
  let query = supabase.from("jobs").select("id,type,status,input_json,created_at,updated_at").order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return (data as JobRow[]) ?? [];
}

export async function listJobOutputs(jobId: string) {
  if (!supabaseEnabled || !supabase) return [];
  const { data } = await supabase
    .from("job_outputs")
    .select("id,type,storage_path,metadata,created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return (data as JobOutput[]) ?? [];
}

export async function getSignedUrl(path: string) {
  if (!supabaseEnabled || !supabase) return null;
  const { data } = await supabase.storage.from("outputs").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
