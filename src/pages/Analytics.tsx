import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

const usageData = [
  { month: "Jan", jobs: 12, intel: 5, travel: 3 },
  { month: "Feb", jobs: 18, intel: 8, travel: 5 },
  { month: "Mar", jobs: 15, intel: 12, travel: 7 },
  { month: "Apr", jobs: 22, intel: 10, travel: 9 },
  { month: "May", jobs: 28, intel: 15, travel: 11 },
  { month: "Jun", jobs: 35, intel: 18, travel: 14 },
];

const creditData = [
  { day: "Mon", used: 12 },
  { day: "Tue", used: 8 },
  { day: "Wed", used: 15 },
  { day: "Thu", used: 22 },
  { day: "Fri", used: 18 },
  { day: "Sat", used: 5 },
  { day: "Sun", used: 3 },
];

const Analytics = () => (
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

export default Analytics;
