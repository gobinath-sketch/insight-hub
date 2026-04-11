import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { createJob, getSignedUrl, listJobOutputs, listJobs, uploadInputs, type JobType } from "@/lib/jobs";
import { subscribeToTable } from "@/lib/realtime";
import { Paperclip, Send } from "lucide-react";

const HandyScrapper = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [jobType] = useState<JobType>("handy");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ id: string; role: "user" | "system"; text: string }[]>([]);
  const [jobs, setJobs] = useState<ReturnType<typeof listJobs> extends Promise<infer R> ? R : never>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<{ id: string; type: string; url: string | null }[]>([]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const data = await listJobs(jobType);
      setJobs(data);
      if (!selectedJobId && data[0]?.id) setSelectedJobId(data[0].id);
    };
    load();
    const unsubJobs = subscribeToTable("jobs", () => load());
    const unsubOutputs = subscribeToTable("job_outputs", () => load());
    return () => {
      unsubJobs();
      unsubOutputs();
    };
  }, [userId, jobType, selectedJobId]);

  useEffect(() => {
    const loadOutputs = async () => {
      if (!selectedJobId) {
        setOutputs([]);
        return;
      }
      const items = await listJobOutputs(selectedJobId);
      const urls = await Promise.all(items.map(async (o) => ({ id: o.id, type: o.type, url: await getSignedUrl(o.storage_path) })));
      setOutputs(urls);
    };
    loadOutputs();
  }, [selectedJobId, jobs.length]);

  const submit = async () => {
    if (!userId) return;
    const urlRegex = /https?:\/\/[^\s]+/g;
    const input_links = message.match(urlRegex) ?? [];
    const input_files = await uploadInputs(userId, files);
    const { jobId } = await createJob(jobType, {
      message,
      links: input_links,
      files: input_files,
    });
    setSelectedJobId(jobId);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: message || "Submitted inputs" },
      { id: crypto.randomUUID(), role: "system", text: "Job started. Outputs will appear on the right." },
    ]);
    setMessage("");
    setFiles([]);
  };

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) ?? null, [jobs, selectedJobId]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-2xl p-5 flex flex-col h-[calc(100vh-9rem)] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h1 className="text-xl font-semibold">HandyScrapper</h1>
              </div>
            </div>

            <div className="flex-1 overflow-auto py-5 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto bg-foreground text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="relative bg-muted/40 border rounded-full px-4 py-2 flex items-center gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[40px] h-10 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-12 pr-24"
                />
                <label
                  htmlFor="handy-files"
                  className="absolute left-3 h-8 w-8 rounded-full bg-background border flex items-center justify-center cursor-pointer hover:bg-muted z-10"
                >
                  <Paperclip className="h-4 w-4" />
                </label>
                <Button
                  className="absolute right-2 h-8 px-3 rounded-full z-10"
                  onClick={submit}
                >
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
                <Input
                  id="handy-files"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">Jobs</h2>
            <div className="space-y-2">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedJobId === j.id ? "bg-muted" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedJobId(j.id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{j.type}</span>
                    <span className="text-xs text-muted-foreground">{j.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">Outputs</h2>
            <div className="space-y-2">
              {outputs.map((o) => (
                <a key={o.id} href={o.url ?? "#"} className="block text-sm underline">
                  {o.type.toUpperCase()}
                </a>
              ))}
            </div>
            {selectedJob ? (
              <div className="mt-3 text-xs text-muted-foreground">
                Status: {selectedJob.status}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HandyScrapper;
