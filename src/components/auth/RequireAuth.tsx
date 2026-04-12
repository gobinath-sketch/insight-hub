import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const RequireAuth = () => {
  const { session, loading } = useSupabaseSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
