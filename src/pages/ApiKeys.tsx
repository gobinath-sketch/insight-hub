import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Eye, EyeOff, Plus } from "lucide-react";
import { useState } from "react";

const mockKeys = [
  { id: 1, name: "Production", key: "24e_live_sk_...7f3a", created: "Jun 1, 2026", lastUsed: "2 hours ago", status: "active" },
  { id: 2, name: "Development", key: "24e_test_sk_...9b2c", created: "May 15, 2026", lastUsed: "1 day ago", status: "active" },
];

const ApiKeys = () => {
  const [showKey, setShowKey] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">API Keys</h1>
              <p className="text-muted-foreground">Manage your API keys for programmatic access.</p>
            </div>
            <Button className="rounded-xl h-10"><Plus className="mr-2 h-4 w-4" /> Create key</Button>
          </div>
        </motion.div>

        <div className="bg-card border rounded-xl divide-y">
          {mockKeys.map((k) => (
            <div key={k.id} className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{k.name}</p>
                  <Badge variant="secondary" className="rounded-md text-xs">{k.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {showKey === k.id ? "24e_live_sk_a8b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7f3a" : k.key}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(showKey === k.id ? null : k.id)}>
                    {showKey === k.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Created {k.created} · Last used {k.lastUsed}</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-destructive text-xs">Revoke</Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiKeys;
