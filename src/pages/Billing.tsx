import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";

type BillingProfile = {
  plan_name: string;
  status: string;
  renewal_date: string;
  price: string;
  credits_used: number;
  credits_limit: number;
  reports_saved: number;
  team_members: number;
  team_limit: number;
  card_last4: string;
  card_expiry: string;
};

type Invoice = { id: string; date: string; amount: string; status: string };

const Billing = () => {
  const { session } = useSupabaseSession();
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const userId = session?.user?.id;

  const loadBilling = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data: profileRow } = await supabase
      .from("billing_profile")
      .select("plan_name,status,renewal_date,price,credits_used,credits_limit,reports_saved,team_members,team_limit,card_last4,card_expiry")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: invoiceRows } = await supabase
      .from("billing_invoices")
      .select("id,date,amount,status")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    setProfile(profileRow as BillingProfile | null);
    setInvoices((invoiceRows as Invoice[]) ?? []);
  };

  useEffect(() => {
    if (!userId) return;
    loadBilling();
    const unsubProfile = subscribeToTable("billing_profile", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadBilling();
    });
    const unsubInvoices = subscribeToTable("billing_invoices", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadBilling();
    });
    return () => {
      unsubProfile();
      unsubInvoices();
    };
  }, [userId]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Billing</h1>
          <p className="text-muted-foreground mb-8">Manage your subscription and payment method.</p>
        </motion.div>

        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{profile?.plan_name ?? "Plan"}</h2>
                <Badge variant="secondary" className="rounded-md">{profile?.status ?? "Active"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {profile?.price ?? "$0"} · Renews {profile?.renewal_date ?? "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg">Change plan</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
            <div><p className="text-sm text-muted-foreground">Credits used</p><p className="text-xl font-bold">{profile ? `${profile.credits_used} / ${profile.credits_limit}` : "—"}</p></div>
            <div><p className="text-sm text-muted-foreground">Reports saved</p><p className="text-xl font-bold">{profile?.reports_saved ?? "—"}</p></div>
            <div><p className="text-sm text-muted-foreground">Team members</p><p className="text-xl font-bold">{profile ? `${profile.team_members} / ${profile.team_limit}` : "—"}</p></div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">Payment Method</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">•••• •••• •••• {profile?.card_last4 ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Expires {profile?.card_expiry ?? "—"}</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg">Update</Button>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-medium mb-4">Invoice History</h2>
          <div className="divide-y">
            {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm">{inv.date}</p>
                    <p className="text-xs text-muted-foreground">{inv.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-md">{inv.status}</Badge>
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs">Download</Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
