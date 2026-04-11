import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Briefcase, Shield, Plane, ArrowRight, TrendingUp, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";
import { useUserProfile } from "@/hooks/useUserProfile";

type ActivityItem = {
  id: string;
  type: "job" | "intel" | "travel";
  title: string;
  created_at: string;
};

const quickActions = [
  { icon: Briefcase, label: "Find Jobs", description: "Upload resume & discover matches", path: "/dashboard/jobs" },
  { icon: Shield, label: "Analyze Competitor", description: "Enter URL for instant intelligence", path: "/dashboard/competitive" },
  { icon: Plane, label: "Plan Trip", description: "Generate AI-powered itinerary", path: "/dashboard/travel" },
];

const Dashboard = () => {
  const { session } = useSupabaseSession();
  const { profile } = useUserProfile();
  const [jobCount, setJobCount] = useState(0);
  const [intelCount, setIntelCount] = useState(0);
  const [travelCount, setTravelCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const loadCounts = async () => {
      const jobs = await supabase
        .from("job_searches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      const intel = await supabase
        .from("competitor_reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      const travel = await supabase
        .from("travel_plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      const reports = await supabase
        .from("competitor_reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      setJobCount(jobs.count ?? 0);
      setIntelCount(intel.count ?? 0);
      setTravelCount(travel.count ?? 0);
      setReportCount(reports.count ?? 0);
    };

    const loadActivity = async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("id,type,title,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setActivity((data as ActivityItem[]) ?? []);
    };

    loadCounts();
    loadActivity();

    const unsubActivity = subscribeToTable<ActivityItem>("activity_log", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadActivity();
    });

    const unsubJobs = subscribeToTable("job_searches", () => loadCounts());
    const unsubIntel = subscribeToTable("competitor_reports", () => loadCounts());
    const unsubTravel = subscribeToTable("travel_plans", () => loadCounts());

    return () => {
      unsubActivity();
      unsubJobs();
      unsubIntel();
      unsubTravel();
    };
  }, [session?.user?.id]);

  const stats = useMemo(
    () => [
      { label: "Job Searches", value: String(jobCount), icon: Briefcase, change: "Total" },
      { label: "Intel Reports", value: String(intelCount), icon: Shield, change: "Total" },
      { label: "Travel Plans", value: String(travelCount), icon: Plane, change: "Total" },
      { label: "Saved Reports", value: String(reportCount), icon: FileText, change: "Total" },
    ],
    [jobCount, intelCount, travelCount, reportCount]
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {profile?.full_name || "User"}</h1>
          <p className="text-muted-foreground mb-8">Here's what's happening across your workspace.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label} · {s.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick actions</h2>
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.path}
                className="flex items-center gap-4 p-4 bg-card border rounded-xl hover-lift group"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent activity</h2>
            <div className="bg-card border rounded-xl divide-y">
            {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {a.type === "job" && <Briefcase className="h-3.5 w-3.5" />}
                    {a.type === "intel" && <Shield className="h-3.5 w-3.5" />}
                    {a.type === "travel" && <Plane className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{a.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
