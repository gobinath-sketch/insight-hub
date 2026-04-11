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
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
      navigate("/login", { replace: true });
      window.location.href = "/login";
    };
    run();
  }, [navigate]);

  return null;
};

export default Logout;
