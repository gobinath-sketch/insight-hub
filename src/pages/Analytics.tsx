import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";

type UsageEvent = { created_at: string; event_type: "jobs" | "intel" | "travel"; credits_used: number };

const Analytics = () => {
  const { session } = useSupabaseSession();
  const [events, setEvents] = useState<UsageEvent[]>([]);

  const userId = session?.user?.id;

  const loadEvents = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from("usage_events")
      .select("created_at,event_type,credits_used")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setEvents((data as UsageEvent[]) ?? []);
  };

  useEffect(() => {
    if (!userId) return;
    loadEvents();
    const unsub = subscribeToTable<UsageEvent>("usage_events", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadEvents();
    });
    return () => unsub();
  }, [userId]);

  const usageData = useMemo(() => {
    const months = new Map<string, { month: string; jobs: number; intel: number; travel: number }>();
    events.forEach((e) => {
      const d = new Date(e.created_at);
      const month = d.toLocaleString("en-US", { month: "short" });
      const row = months.get(month) ?? { month, jobs: 0, intel: 0, travel: 0 };
      row[e.event_type] += 1;
      months.set(month, row);
    });
    return Array.from(months.values()).slice(-6);
  }, [events]);

  const creditData = useMemo(() => {
    const days = new Map<string, { day: string; used: number }>();
    events.forEach((e) => {
      const day = new Date(e.created_at).toLocaleString("en-US", { weekday: "short" });
      const row = days.get(day) ?? { day, used: 0 };
      row.used += e.credits_used ?? 0;
      days.set(day, row);
    });
    return Array.from(days.values()).slice(-7);
  }, [events]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Usage Analytics</h1>
          <p className="text-muted-foreground mb-8">Monitor your platform usage and credit consumption.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-medium mb-6">Searches by Product</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Bar dataKey="jobs" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Jobs" />
                <Bar dataKey="intel" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Intel" />
                <Bar dataKey="travel" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Travel" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-medium mb-6">Credits Used (This Week)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={creditData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Line type="monotone" dataKey="used" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4 }} name="Credits" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
