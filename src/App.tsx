import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/jobs" element={<JobFinder />} />
          <Route path="/dashboard/competitive" element={<CompetitiveIntel />} />
          <Route path="/dashboard/travel" element={<TravelPlanner />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/billing" element={<Billing />} />
          <Route path="/dashboard/api-keys" element={<ApiKeys />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
