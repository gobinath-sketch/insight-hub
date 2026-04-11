import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { supabaseEnabled, supabaseInitError } from "@/lib/supabaseClient";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import JobFinder from "./pages/JobFinder";
import CompetitiveIntel from "./pages/CompetitiveIntel";
import TravelPlanner from "./pages/TravelPlanner";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import ApiKeys from "./pages/ApiKeys";
import DashboardSettings from "./pages/DashboardSettings";
import NotFound from "./pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        {!supabaseEnabled ? (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg text-center">
              <h1 className="text-xl font-semibold mb-2">Configuration Error</h1>
              <p className="text-sm text-muted-foreground break-words">{supabaseInitError}</p>
            </div>
          </div>
        ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/jobs" element={<JobFinder />} />
              <Route path="/dashboard/competitive" element={<CompetitiveIntel />} />
              <Route path="/dashboard/travel" element={<TravelPlanner />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/api-keys" element={<ApiKeys />} />
              <Route path="/dashboard/settings" element={<DashboardSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        )}
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
