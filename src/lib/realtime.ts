import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";

type ChangeHandler<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

export function subscribeToTable<T>(
  table: string,
  handler: ChangeHandler<T>,
  schema = "public"
) {
  if (!supabaseEnabled || !supabase) {
    return () => {};
  }

  let channelId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  if (!channelId || channelId.trim() === "") {
    channelId = `${Date.now()}-${Math.random()}`;
  }

  const channel = supabase
    .channel(`rt:${schema}:${table}:${channelId}`)
    .on(
      "postgres_changes",
      { event: "*", schema, table },
      (payload) => handler(payload as RealtimePostgresChangesPayload<T>)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
