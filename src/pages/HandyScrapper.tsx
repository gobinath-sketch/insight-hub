import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { createJob, getSignedUrl, listJobOutputs, listJobs, uploadInputs, type JobType } from "@/lib/jobs";
import { subscribeToTable } from "@/lib/realtime";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { Paperclip, Send, X, TriangleAlert } from "lucide-react";

const HandyScrapper = () => {
  const { session, loading } = useSupabaseSession();
  const userId = session?.user?.id;
  const [jobType] = useState<JobType>("handy");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ id: string; role: "user" | "system"; text: string }[]>([]);
  const [jobs, setJobs] = useState<ReturnType<typeof listJobs> extends Promise<infer R> ? R : never>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<{ id: string; type: string; url: string | null }[]>([]);
  const [runLogs, setRunLogs] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(false);

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
    const unsubRuns = subscribeToTable("job_runs", () => load());
    return () => {
      unsubJobs();
      unsubOutputs();
      unsubRuns();
    };
  }, [userId, jobType, selectedJobId]);

  useEffect(() => {
    const loadOutputs = async () => {
      if (!selectedJobId) {
        setOutputs([]);
        return;
      }
      const items = await listJobOutputs(selectedJobId);
      const urls = await Promise.all(
        items.map(async (o) => ({ id: o.id, type: o.type, url: await getSignedUrl(o.storage_path) }))
      );
      setOutputs(urls);
      if (supabaseEnabled && supabase && selectedJobId) {
        const { data: runs } = await supabase
          .from("job_runs")
          .select("stage,logs,error,started_at")
          .eq("job_id", selectedJobId)
          .order("started_at", { ascending: false })
          .limit(5);
        const latestReport = runs?.find((r) => r.stage === "report");
        const last = runs?.[0];
        if (latestReport?.logs) {
          setMessages((prev) => {
            const already = prev.some((m) => m.text === latestReport.logs);
            return already ? prev : [...prev, { id: crypto.randomUUID(), role: "system", text: latestReport.logs }];
          });
        }
        if (urls.length) {
          const linksText = urls
            .map((u) => `${u.type.toUpperCase()}: ${u.url ?? ""}`)
            .join("\n");
          setMessages((prev) => {
            const already = prev.some((m) => m.text.includes("PDF:"));
            return already ? prev : [...prev, { id: crypto.randomUUID(), role: "system", text: linksText }];
          });
        }
        setRunLogs(last ? `${last.stage}: ${last.error || last.logs || ""}` : null);
        if (last?.stage === "done" || last?.stage === "error") {
          setPolling(false);
        }
      }
    };
    loadOutputs();
  }, [selectedJobId, jobs.length]);

  useEffect(() => {
    if (!polling || !selectedJobId) return;
    const id = setInterval(async () => {
      const items = await listJobOutputs(selectedJobId);
      if (items.length) {
        const urls = await Promise.all(
          items.map(async (o) => ({ id: o.id, type: o.type, url: await getSignedUrl(o.storage_path) }))
        );
        setOutputs(urls);
        const linksText = urls
          .map((u) => `${u.type.toUpperCase()}: ${u.url ?? ""}`)
          .join("\n");
        setMessages((prev) => {
          const already = prev.some((m) => m.text.includes("PDF:"));
          return already ? prev : [...prev, { id: crypto.randomUUID(), role: "system", text: linksText }];
        });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [polling, selectedJobId]);

  const submit = async () => {
    if (!userId) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", text: "Please log in again to send messages." },
      ]);
      return;
    }
    if (!message.trim() && files.length === 0) return;
    setSending(true);
    const urlRegex = /https?:\/\/[^\s]+/g;
    const input_links = message.match(urlRegex) ?? [];
    const input_files = await uploadInputs(userId, files);
    try {
      const { jobId } = await createJob(jobType, {
        message,
        links: input_links,
        files: input_files,
      });
      setSelectedJobId(jobId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: message || "Submitted inputs" },
        { id: crypto.randomUUID(), role: "system", text: "Job started. Results and downloads will appear here in chat." },
      ]);
      setMessage("");
      setFiles([]);
      setPolling(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", text: `Failed to send: ${msg}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) ?? null, [jobs, selectedJobId]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-card border rounded-2xl p-5 flex flex-col h-[calc(100vh-9rem)] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h1 className="text-xl font-semibold">HandyScrapper</h1>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-5 space-y-3">
            {!loading && !userId ? (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <TriangleAlert className="h-4 w-4" />
                You are not logged in. Sign in to send jobs.
              </div>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Checking session…
              </div>
            ) : null}
            {messages.map((m) => {
              const lines = m.text.split("\n");
              const isLinks = lines.some((l) => l.startsWith("PDF:") || l.startsWith("DOCX:") || l.startsWith("CSV:"));
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === "user"
                      ? "ml-auto bg-foreground text-primary-foreground"
                      : "bg-muted text-foreground"
                    }`}
                >
                  {isLinks ? (
                    <div className="space-y-1">
                      {lines.map((l) => {
                        const [label, url] = l.split(": ").map((s) => s.trim());
                        if (!url) return <div key={l}>{l}</div>;
                        return (
                          <a key={l} href={url} className="underline block" target="_blank" rel="noreferrer">
                            {label}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              );
            })}
            {polling ? (
              <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed bg-muted text-foreground">
                Processing… extracting resume → scraping → generating report
              </div>
            ) : null}
          </div>

          <div className="border-t pt-4 space-y-3">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="h-4 w-4 rounded-full hover:bg-background flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative bg-muted/40 border rounded-full px-3 py-2 flex items-center gap-2">
              <label
                htmlFor="handy-files"
                className="h-9 w-9 rounded-full bg-background border flex items-center justify-center cursor-pointer hover:bg-muted"
              >
                <Paperclip className="h-4 w-4" />
              </label>
              <Input
                id="handy-files"
                type="file"
                multiple
                onChange={(e) => {
                  const next = Array.from(e.target.files ?? []);
                  if (!next.length) return;
                  setFiles((prev) => [...prev, ...next]);
                  e.currentTarget.value = "";
                }}
                className="hidden"
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="min-h-[44px] h-11 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 pr-28"
                placeholder="Type your request and attach files if needed..."
              />
              <Button
                className="absolute right-2 h-9 px-4 rounded-full z-10"
                onClick={submit}
                disabled={sending || (!message.trim() && files.length === 0)}
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HandyScrapper;
