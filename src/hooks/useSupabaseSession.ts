import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { ensureUserProfile } from "@/lib/profile";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let lastSession: Session | null = null;
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
      if (!error) {
        lastSession = data.session ?? null;
        setSession(lastSession);
        await ensureUserProfile(lastSession);
      }
      if (!data.session && !error) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!mounted) return;
        if (refreshed.session) {
          lastSession = refreshed.session;
          setSession(refreshed.session);
          await ensureUserProfile(refreshed.session);
        }
      }
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      lastSession = nextSession;
      setSession(nextSession);
      await ensureUserProfile(nextSession);
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(async ({ data, error }) => {
          if (!mounted) return;
          if (error) return;
          if (data.session?.access_token !== lastSession?.access_token) {
            lastSession = data.session ?? null;
            setSession(lastSession);
          }
          if (!data.session) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (!mounted) return;
            if (refreshed.session) {
              lastSession = refreshed.session;
              setSession(refreshed.session);
              await ensureUserProfile(refreshed.session);
            }
          }
        });
      }
    };

    window.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { session, loading };
}
