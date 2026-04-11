import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, MapPin, DollarSign, Briefcase, Star, ExternalLink, ChevronRight, FileText, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";
import { createJob, getSignedUrl, listJobOutputs, uploadInputs } from "@/lib/jobs";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  match_score: number;
  source: string;
  remote: boolean;
  missing_skills: string[];
  why_fit: string;
  posted: string;
  search_id: string;
};

const JobFinder = () => {
  const { session } = useSupabaseSession();
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [fileName, setFileName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("any");
  const [minSalary, setMinSalary] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobOutputs, setJobOutputs] = useState<{ id: string; type: string; url: string | null }[]>([]);

  const userId = session?.user?.id;

  const loadLatestSearch = async () => {
    if (!userId || !supabaseEnabled) return;
    if (!supabase) return;
    const { data: search } = await supabase
      .from("job_searches")
      .select("id,role,location,work_type,min_salary,resume_path")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!search?.id) return;
    setActiveSearchId(search.id);
    setHasSearched(true);
    setRole(search.role ?? "");
    setLocation(search.location ?? "");
    setWorkType(search.work_type ?? "any");
    setMinSalary(search.min_salary ?? "");
    await loadJobs(search.id);
  };

  const loadJobs = async (searchId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("job_results")
      .select("id,title,company,location,salary,match_score,source,remote,missing_skills,why_fit,posted,search_id")
      .eq("search_id", searchId)
      .order("match_score", { ascending: false });
    setJobs((data as Job[]) ?? []);
  };

  useEffect(() => {
    if (!userId) return;
    loadLatestSearch();

    const unsubSearches = subscribeToTable("job_searches", (payload) => {
      if ((payload.new as any)?.user_id !== userId) return;
      loadLatestSearch();
    });
    const unsubJobs = subscribeToTable("job_results", (payload) => {
      if (!activeSearchId) return;
      if ((payload.new as any)?.search_id !== activeSearchId) return;
      loadJobs(activeSearchId);
    });

    return () => {
      unsubSearches();
      unsubJobs();
    };
  }, [userId, activeSearchId]);

  const handleSearch = async () => {
    if (!userId) return;
    setLoading(true);

    if (!supabase) return;
    const { data: searchRow, error: searchError } = await supabase
      .from("job_searches")
      .insert({
        user_id: userId,
        role,
        location,
        work_type: workType,
        min_salary: minSalary,
      })
      .select("id")
      .single();

    if (searchError || !searchRow?.id) {
      setLoading(false);
      return;
    }

    let resumePath: string | null = null;
    if (resumeFile) {
      const path = `${userId}/${searchRow.id}/${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, resumeFile, { upsert: true });
      if (!uploadError) {
        resumePath = path;
      }
    }

    if (resumePath) {
      await supabase
        .from("job_searches")
        .update({ resume_path: resumePath })
        .eq("id", searchRow.id);
    }

    // Job results should be inserted by your real matching pipeline.
    await supabase.from("activity_log").insert({
      user_id: userId,
      type: "job",
      title: `${role || "Job"} search completed`,
    });
    await supabase.from("usage_events").insert({
      user_id: userId,
      event_type: "jobs",
      credits_used: 1,
    });

    setActiveSearchId(searchRow.id);
    await loadJobs(searchRow.id);
    setLoading(false);
    setHasSearched(true);
  };

  const handleGenerate = async () => {
    if (!userId) return;
    setLoading(true);
    const uploaded = resumeFile ? await uploadInputs(userId, [resumeFile]) : [];
    const { jobId: createdId } = await createJob("job", {
      role,
      location,
      workType,
      minSalary,
      files: uploaded,
    });
    setJobId(createdId);
    setLoading(false);
    setHasSearched(true);
  };

  useEffect(() => {
    const loadOutputs = async () => {
      if (!jobId) return;
      const items = await listJobOutputs(jobId);
      const urls = await Promise.all(
        items.map(async (o) => ({ id: o.id, type: o.type, url: await getSignedUrl(o.storage_path) }))
      );
      setJobOutputs(urls);
    };
    loadOutputs();
  }, [jobId]);

  const jobsFoundText = useMemo(
    () => `${jobs.length} jobs found across 6 platforms`,
    [jobs.length]
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Job Opportunity Finder</h1>
          <p className="text-muted-foreground mb-8">Upload your resume and discover AI-matched opportunities.</p>
        </motion.div>

        {/* Input Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 lg:col-span-4">
              <Label className="text-sm mb-2 block">Resume</Label>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-foreground/20 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{fileName}</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setResumeFile(file);
                    setFileName(file?.name || "");
                  }}
                />
              </label>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Role</Label>
              <Input className="rounded-xl h-10" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Location</Label>
              <Input className="rounded-xl h-10" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Work Type</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Min Salary</Label>
              <Input className="rounded-xl h-10" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerate} className="rounded-xl h-10">
            <Search className="mr-2 h-4 w-4" />
            Find matching jobs
          </Button>
        </motion.div>

        {jobOutputs.length > 0 && (
          <div className="bg-card border rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {jobOutputs.map((o) => (
                <a key={o.id} href={o.url ?? "#"} className="text-sm underline">
                  {o.type.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-xl p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-10 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && (
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{jobsFoundText}</p>
                <Select defaultValue="match">
                  <SelectTrigger className="w-40 rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Sort by match</SelectItem>
                    <SelectItem value="salary">Sort by salary</SelectItem>
                    <SelectItem value="date">Sort by date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedJob(job)}
                  className={`bg-card border rounded-xl p-5 cursor-pointer hover-lift ${selectedJob?.id === job.id ? "ring-2 ring-foreground/10" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <div className={`text-lg font-bold ${job.match_score >= 90 ? "text-foreground" : job.match_score >= 80 ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                          {job.match_score}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" />{job.salary}</span>
                        <Badge variant="secondary" className="text-xs rounded-md">{job.source}</Badge>
                        {job.remote && <Badge variant="outline" className="text-xs rounded-md">Remote</Badge>}
                      </div>
                      {(job.missing_skills?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="h-3 w-3 text-warning" />
                          <span className="text-xs text-muted-foreground">Missing: {job.missing_skills.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Detail Panel */}
            {selectedJob && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-80 shrink-0 hidden xl:block"
              >
                <div className="bg-card border rounded-xl p-6 sticky top-6 space-y-5">
                  <div>
                    <h2 className="font-semibold text-lg">{selectedJob.title}</h2>
                    <p className="text-muted-foreground text-sm">{selectedJob.company} · {selectedJob.posted}</p>
                  </div>
                  <div className="text-center py-4 bg-muted rounded-xl">
                    <p className="text-3xl font-bold">{selectedJob.match_score ?? 0}%</p>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Why you fit</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.why_fit}</p>
                  </div>
                  {(selectedJob.missing_skills?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Skill gaps</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.missing_skills.map((s) => (
                          <Badge key={s} variant="secondary" className="rounded-md">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button className="w-full rounded-xl h-10"><ExternalLink className="mr-2 h-4 w-4" />Apply now</Button>
                    <Button variant="outline" className="w-full rounded-xl h-10"><FileText className="mr-2 h-4 w-4" />Generate cover letter</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && !loading && <div className="py-10" />}
      </div>
    </DashboardLayout>
  );
};

export default JobFinder;
