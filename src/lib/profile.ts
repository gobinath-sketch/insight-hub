import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";

export async function ensureUserProfile(session: Session | null) {
  if (!session?.user?.id || !supabaseEnabled || !supabase) return;
  const user = session.user;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.id) {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      "";

    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
    });
  }

  await supabase.from("user_settings").upsert({
    user_id: user.id,
    notifications: {
      jobAlerts: true,
      competitorAlerts: true,
      weeklyDigest: true,
      productUpdates: true,
    },
  });

  // Billing data should be created by your real billing system.
}
