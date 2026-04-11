import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search, Globe, TrendingUp, TrendingDown, Minus, AlertTriangle, FileText, Plus, X } from "lucide-react";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";

type CompetitorReport = {
  id?: string;
  name: string;
  url: string;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  pricing: { tier: string; price: string; features: string[] }[];
  signals: string[];
  positioning: string;
  direction: string;
};

const CompetitiveIntel = () => {
  const { session } = useSupabaseSession();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([""]);
  const [report, setReport] = useState<CompetitorReport | null>(null);

  const userId = session?.user?.id;

  const loadLatestReport = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from("competitor_reports")
      .select("id,name,url,swot,pricing,signals,positioning,direction")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setReport(data as CompetitorReport);
      setHasAnalyzed(true);
    }
  };

  useEffect(() => {
    if (!userId || !supabaseEnabled || !supabase) return;
    loadLatestReport();
    const unsub = subscribeToTable<CompetitorReport>("competitor_reports", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadLatestReport();
    });
    return () => unsub();
  }, [userId]);

  const handleAnalyze = async () => {
    if (!userId) return;
    setLoading(true);
    const urlList = urls.filter((u) => u.trim().length > 0).join(", ");
    const newReport = {
      user_id: userId,
      name: urlList || "Competitor",
      url: urlList,
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      pricing: [],
      signals: [],
      positioning: "",
      direction: "",
    };
    const { data, error } = await supabase
      .from("competitor_reports")
      .insert(newReport)
      .select("id,name,url,swot,pricing,signals,positioning,direction")
      .single();
    if (!error) {
      setReport(data as CompetitorReport);
      setHasAnalyzed(true);
      await supabase.from("activity_log").insert({
        user_id: userId,
        type: "intel",
        title: `Competitive report created for ${data?.name ?? "competitor"}`,
      });
      await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: "intel",
        credits_used: 2,
      });
    }
    setLoading(false);
  };

  const swot = report?.swot ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const pricing = report?.pricing ?? [];
  const signals = report?.signals ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Competitive Intelligence</h1>
          <p className="text-muted-foreground mb-8">Analyze competitors with AI-powered scraping and synthesis.</p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-xl p-6 mb-6">
          <Label className="text-sm mb-3 block">Competitor URLs</Label>
          <div className="space-y-2 mb-4">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => { const n = [...urls]; n[i] = e.target.value; setUrls(n); }}
                  className="rounded-xl h-10"
                />
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setUrls(urls.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setUrls([...urls, ""])}>
              <Plus className="mr-1 h-3 w-3" /> Add URL
            </Button>
            <Button onClick={handleAnalyze} className="rounded-xl h-10">
              <Search className="mr-2 h-4 w-4" /> Analyze competitors
            </Button>
          </div>
        </motion.div>

        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {hasAnalyzed && !loading && report && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{report.name}</h2>
                  <p className="text-sm text-muted-foreground">{report.url}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Positioning</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.positioning}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Predicted Direction</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.direction}</p>
                </div>
              </div>
            </div>

            {/* SWOT */}
            <div className="grid md:grid-cols-2 gap-4">
              {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((key) => {
                const icons = { strengths: TrendingUp, weaknesses: TrendingDown, opportunities: TrendingUp, threats: AlertTriangle };
                const Icon = icons[key];
                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-xl p-5">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 capitalize">
                      <Icon className="h-4 w-4" /> {key}
                    </h3>
                    <ul className="space-y-2">
                      {(swot[key] ?? []).map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Minus className="h-3 w-3 mt-1 shrink-0" /> {item}
                          </li>
                        ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            {/* Pricing */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-medium mb-4">Pricing Breakdown</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {pricing.map((p) => (
                    <div key={p.tier} className="border rounded-xl p-4">
                      <p className="font-medium">{p.tier}</p>
                      <p className="text-2xl font-bold mt-1 mb-3">{p.price}</p>
                      <ul className="space-y-1.5">
                        {p.features.map((f) => (
                          <li key={f} className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-foreground/30" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>

            {/* Signals */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-medium mb-4">Hiring & Strategy Signals</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {signals.map((s) => (
                    <div key={s} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-2 w-2 rounded-full bg-foreground/30 shrink-0" />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Button variant="outline" className="rounded-xl"><FileText className="mr-2 h-4 w-4" /> Export PDF Report</Button>
          </div>
        )}

        {!hasAnalyzed && !loading && <div className="py-10" />}
      </div>
    </DashboardLayout>
  );
};

export default CompetitiveIntel;
