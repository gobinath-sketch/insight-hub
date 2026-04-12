import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch {
        // ignore
      }
      try {
        // Remove only Supabase auth keys to avoid nuking other app state.
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("sb-")) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // ignore
      }
      navigate("/login", { replace: true });
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-sm text-muted-foreground">Signing you out…</div>
    </div>
  );
};

export default Logout;
