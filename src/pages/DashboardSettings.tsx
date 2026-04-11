import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";
import { useUserProfile } from "@/hooks/useUserProfile";

const DashboardSettings = () => {
  const { session } = useSupabaseSession();
  const { profile } = useUserProfile();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    competitorAlerts: true,
    weeklyDigest: true,
    productUpdates: true,
  });

  const userId = session?.user?.id;

  const loadSettings = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from("user_settings")
      .select("notifications")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
    if (profile) {
      setFullName(profile.full_name ?? "");
      setEmail(profile.email ?? "");
    }
  };

  useEffect(() => {
    loadSettings();
    if (!userId || !supabaseEnabled || !supabase) return;
    const unsub = subscribeToTable("user_settings", (payload) => {
      if ((payload.new as any)?.user_id !== userId) return;
      if ((payload.new as any)?.notifications) setNotifications((payload.new as any).notifications);
    });
    return () => unsub();
  }, [userId, profile?.id]);

  const saveProfile = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    await supabase.from("profiles").update({ full_name: fullName, email }).eq("id", userId);
  };

  const saveNotifications = async (next: typeof notifications) => {
    if (!userId) return;
    setNotifications(next);
    await supabase.from("user_settings").upsert({
      user_id: userId,
      notifications: next,
    });
  };

  return (
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
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                {(fullName || "U").slice(0, 2).toUpperCase()}
              </div>
              <Button variant="outline" size="sm" className="rounded-lg">Change photo</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" />
              </div>
            </div>
            <Button className="mt-4 rounded-xl h-10" onClick={saveProfile}>Save changes</Button>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-medium mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <span className="text-sm">Job match alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.jobAlerts}
                  onChange={(e) => saveNotifications({ ...notifications, jobAlerts: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <span className="text-sm">Competitor change alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.competitorAlerts}
                  onChange={(e) => saveNotifications({ ...notifications, competitorAlerts: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <span className="text-sm">Weekly digest</span>
                <input
                  type="checkbox"
                  checked={notifications.weeklyDigest}
                  onChange={(e) => saveNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <span className="text-sm">Product updates</span>
                <input
                  type="checkbox"
                  checked={notifications.productUpdates}
                  onChange={(e) => saveNotifications({ ...notifications, productUpdates: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
              </label>
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
};

export default DashboardSettings;
