import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useUser } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import BeatMap from "@/pages/beat-map";
import Delivery from "@/pages/delivery";
import Leads from "@/pages/leads";
import Sales from "@/pages/sales";
import Followups from "@/pages/followups";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Single flat router — auth guard at the top, no nested Switch
function AppRouter() {
  const { user, loading } = useUser();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user && location !== "/login") {
      setLocation("/login");
    } else if (user && location === "/login") {
      setLocation("/dashboard");
    }
  }, [loading, user, location, setLocation]);

  // Still loading auth state
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary text-sm">
        Loading…
      </div>
    );
  }

  // Not logged in — always show Login
  if (!user) {
    return <Login />;
  }

  // Logged in — flat Switch inside AppLayout
  return (
    <AppLayout>
      <Switch>
        <Route path="/"          component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/beat-map"  component={BeatMap} />
        <Route path="/delivery"  component={Delivery} />
        <Route path="/leads"     component={Leads} />
        <Route path="/sales"     component={Sales} />
        <Route path="/followups" component={Followups} />
        <Route path="/reports"   component={Reports} />
        <Route path="/admin"     component={Admin} />
        <Route path="/settings"  component={Settings} />
        <Route path="/login"     component={Dashboard} />
        <Route                   component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster theme="dark" position="top-center" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
