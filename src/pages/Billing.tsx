import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";

const Billing = () => (
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
              <h2 className="font-medium">Pro Plan</h2>
              <Badge variant="secondary" className="rounded-md">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">$29/month · Renews Jul 15, 2026</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg">Change plan</Button>
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
          <div><p className="text-sm text-muted-foreground">Credits used</p><p className="text-xl font-bold">847 / 1,000</p></div>
          <div><p className="text-sm text-muted-foreground">Reports saved</p><p className="text-xl font-bold">25</p></div>
          <div><p className="text-sm text-muted-foreground">Team members</p><p className="text-xl font-bold">1 / 5</p></div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-medium mb-4">Payment Method</h2>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">•••• •••• •••• 4242</p>
            <p className="text-xs text-muted-foreground">Expires 12/27</p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-lg">Update</Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-medium mb-4">Invoice History</h2>
        <div className="divide-y">
          {[
            { date: "Jun 15, 2026", amount: "$29.00", status: "Paid" },
            { date: "May 15, 2026", amount: "$29.00", status: "Paid" },
            { date: "Apr 15, 2026", amount: "$29.00", status: "Paid" },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between py-3">
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

export default Billing;
