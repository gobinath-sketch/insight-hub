import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Eye, EyeOff, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";

type ApiKeyRow = {
  id: string;
  name: string;
  key_value: string;
  created_at: string;
  last_used_at: string | null;
  status: string;
};

const ApiKeys = () => {
  const { session } = useSupabaseSession();
  const [showKey, setShowKey] = useState<number | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);

  const userId = session?.user?.id;

  const loadKeys = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from("api_keys")
      .select("id,name,key_value,created_at,last_used_at,status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setKeys((data as ApiKeyRow[]) ?? []);
  };

  useEffect(() => {
    if (!userId || !supabaseEnabled || !supabase) return;
    loadKeys();
    const unsub = subscribeToTable<ApiKeyRow>("api_keys", (payload) => {
      if ((payload.new as any)?.user_id !== userId) return;
      loadKeys();
    });
    return () => unsub();
  }, [userId]);

  const generateKey = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return `24e_live_sk_${Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  };

  const createKey = async () => {
    if (!userId) return;
    const keyValue = generateKey();
    await supabase.from("api_keys").insert({
      user_id: userId,
      name: "New Key",
      key_value: keyValue,
      status: "active",
    });
  };

  const revokeKey = async (id: string) => {
    if (!supabaseEnabled || !supabase) return;
    await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">API Keys</h1>
              <p className="text-muted-foreground">Manage your API keys for programmatic access.</p>
            </div>
            <Button className="rounded-xl h-10" onClick={createKey}><Plus className="mr-2 h-4 w-4" /> Create key</Button>
          </div>
        </motion.div>

        <div className="bg-card border rounded-xl divide-y">
          {keys.map((k, idx) => (
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
                    {showKey === idx ? k.key_value : `${k.key_value.slice(0, 12)}...${k.key_value.slice(-4)}`}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(showKey === idx ? null : idx)}>
                    {showKey === idx ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(k.key_value)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {new Date(k.created_at).toLocaleDateString()} · Last used {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "never"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-destructive text-xs" onClick={() => revokeKey(k.id)}>Revoke</Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiKeys;
