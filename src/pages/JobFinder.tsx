import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, MapPin, DollarSign, Briefcase, Star, ExternalLink, ChevronRight, FileText, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  source: string;
  remote: boolean;
  missingSkills: string[];
  whyFit: string;
  posted: string;
};

const mockJobs: Job[] = [
  { id: 1, title: "Senior Frontend Engineer", company: "Vercel", location: "Remote", salary: "$160k–$200k", matchScore: 96, source: "LinkedIn", remote: true, missingSkills: [], whyFit: "Strong React/TypeScript experience aligns perfectly with role requirements.", posted: "2d ago" },
  { id: 2, title: "Staff Software Engineer", company: "Linear", location: "San Francisco, CA", salary: "$180k–$240k", matchScore: 91, source: "Wellfound", remote: false, missingSkills: ["Rust"], whyFit: "Excellent systems design background. Missing Rust experience but transferable skills present.", posted: "1d ago" },
  { id: 3, title: "Full Stack Engineer", company: "Notion", location: "Remote", salary: "$150k–$190k", matchScore: 88, source: "Indeed", remote: true, missingSkills: ["PostgreSQL"], whyFit: "Strong full-stack profile. Would benefit from deeper database expertise.", posted: "3d ago" },
  { id: 4, title: "Product Engineer", company: "Figma", location: "New York, NY", salary: "$170k–$210k", matchScore: 85, source: "Glassdoor", remote: false, missingSkills: ["C++", "WebGL"], whyFit: "Product mindset is strong. Graphics programming is a gap.", posted: "5d ago" },
  { id: 5, title: "Backend Engineer", company: "Stripe", location: "Remote", salary: "$175k–$225k", matchScore: 79, source: "LinkedIn", remote: true, missingSkills: ["Ruby", "Go"], whyFit: "Payment systems experience limited but strong API design skills.", posted: "1w ago" },
];

const JobFinder = () => {
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [fileName, setFileName] = useState("");

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasSearched(true); }, 1500);
  };

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
                <span className="text-sm text-muted-foreground">{fileName || "Drop PDF or DOCX here, or click to browse"}</span>
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
              </label>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Role</Label>
              <Input placeholder="e.g. Frontend Engineer" className="rounded-xl h-10" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Location</Label>
              <Input placeholder="e.g. San Francisco" className="rounded-xl h-10" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Work Type</Label>
              <Select defaultValue="any">
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
              <Input placeholder="e.g. $120k" className="rounded-xl h-10" />
            </div>
          </div>
          <Button onClick={handleSearch} className="rounded-xl h-10">
            <Search className="mr-2 h-4 w-4" />
            Find matching jobs
          </Button>
        </motion.div>

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
                <p className="text-sm text-muted-foreground">{mockJobs.length} jobs found across 6 platforms</p>
                <Select defaultValue="match">
                  <SelectTrigger className="w-40 rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Sort by match</SelectItem>
                    <SelectItem value="salary">Sort by salary</SelectItem>
                    <SelectItem value="date">Sort by date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mockJobs.map((job) => (
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
                        <div className={`text-lg font-bold ${job.matchScore >= 90 ? "text-foreground" : job.matchScore >= 80 ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                          {job.matchScore}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" />{job.salary}</span>
                        <Badge variant="secondary" className="text-xs rounded-md">{job.source}</Badge>
                        {job.remote && <Badge variant="outline" className="text-xs rounded-md">Remote</Badge>}
                      </div>
                      {job.missingSkills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="h-3 w-3 text-warning" />
                          <span className="text-xs text-muted-foreground">Missing: {job.missingSkills.join(", ")}</span>
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
                    <p className="text-3xl font-bold">{selectedJob.matchScore}%</p>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Why you fit</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.whyFit}</p>
                  </div>
                  {selectedJob.missingSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Skill gaps</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.missingSkills.map((s) => (
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
        {!hasSearched && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No searches yet</p>
            <p className="text-sm">Upload your resume and set filters to find matching jobs.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobFinder;
