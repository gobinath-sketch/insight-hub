import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const RequireAuth = () => {
  const { session, loading } = useSupabaseSession();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
