import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DashboardSettings = () => (
  <DashboardLayout>
    <div className="max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and preferences.</p>
      </motion.div>

      <div className="space-y-8">
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-medium mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">JD</div>
            <Button variant="outline" size="sm" className="rounded-lg">Change photo</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label className="text-sm mb-2 block">Full name</Label><Input defaultValue="Jane Doe" className="rounded-xl h-10" /></div>
            <div><Label className="text-sm mb-2 block">Email</Label><Input defaultValue="jane@example.com" className="rounded-xl h-10" /></div>
          </div>
          <Button className="mt-4 rounded-xl h-10">Save changes</Button>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-medium mb-4">Notifications</h2>
          <div className="space-y-3">
            {["Job match alerts", "Competitor change alerts", "Weekly digest", "Product updates"].map((n) => (
              <label key={n} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <span className="text-sm">{n}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-medium mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all data.</p>
          <Button variant="destructive" size="sm" className="rounded-lg">Delete account</Button>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default DashboardSettings;
