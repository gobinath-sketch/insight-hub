import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Briefcase, Shield, Plane, ArrowRight, TrendingUp, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Job Searches", value: "12", icon: Briefcase, change: "+3 this week" },
  { label: "Intel Reports", value: "8", icon: Shield, change: "+2 this week" },
  { label: "Travel Plans", value: "5", icon: Plane, change: "+1 this week" },
  { label: "Saved Reports", value: "25", icon: FileText, change: "Total" },
];

const recentActivity = [
  { type: "job", title: "Senior Engineer roles — 94% match found", time: "2 hours ago" },
  { type: "intel", title: "Competitor analysis: Acme Corp updated pricing", time: "5 hours ago" },
  { type: "travel", title: "Tokyo 7-day itinerary generated", time: "1 day ago" },
  { type: "job", title: "Resume gap analysis completed", time: "2 days ago" },
  { type: "intel", title: "Weekly monitoring: 3 changes detected", time: "3 days ago" },
];

const quickActions = [
  { icon: Briefcase, label: "Find Jobs", description: "Upload resume & discover matches", path: "/dashboard/jobs" },
  { icon: Shield, label: "Analyze Competitor", description: "Enter URL for instant intelligence", path: "/dashboard/competitive" },
  { icon: Plane, label: "Plan Trip", description: "Generate AI-powered itinerary", path: "/dashboard/travel" },
];

const Dashboard = () => (
  <DashboardLayout>
    <div className="max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Welcome back, Jane</h1>
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
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
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
                  {a.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Dashboard;
