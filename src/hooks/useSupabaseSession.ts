import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { ensureUserProfile } from "@/lib/profile";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);

    if (!supabaseEnabled || !supabase) {
      setSession(null);
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setSession(null);
      } else {
        setSession(data.session ?? null);
        await ensureUserProfile(data.session ?? null);
      }
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await ensureUserProfile(nextSession);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
