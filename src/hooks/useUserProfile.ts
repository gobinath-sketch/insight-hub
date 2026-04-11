import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export function useUserProfile() {
  const { session } = useSupabaseSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;

    supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfile((data as UserProfile) ?? null);
        setLoading(false);
      });

    const unsubscribe = subscribeToTable<UserProfile>("profiles", (payload) => {
      if (payload.new?.id === userId) {
        setProfile(payload.new as UserProfile);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [session?.user?.id]);

  return { profile, loading };
}
