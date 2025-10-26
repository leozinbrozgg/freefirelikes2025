import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { AccessProvider } from "@/contexts/AccessContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import { supabase } from "@/lib/supabase";
import { AccessService } from "@/services/accessService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessProvider>
      <HistoryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </HistoryProvider>
    </AccessProvider>
  </QueryClientProvider>
);

export default App;

// Guard de admin usando sessão do Supabase (email/senha)
function RequireAdmin({ children }: { children: JSX.Element }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      let ok = !!data.session;
      // Enforce IP policy if logged in
      if (ok && data.session?.user) {
        try {
          const userId = data.session.user.id;
          const profile = await AccessService.getAdminProfile(userId);
          if (profile && (profile.enforce_ip || (profile.allowed_ip && profile.allowed_ip.trim() !== ''))) {
            // Get public IP
            let ip: string | undefined;
            try {
              const res = await fetch('https://api.ipify.org?format=json');
              const j = await res.json();
              ip = j?.ip;
            } catch {}
            // Validate rules
            let allowed = true;
            if (profile.allowed_ip && profile.allowed_ip.trim() !== '') {
              allowed = !!ip && ip === profile.allowed_ip;
            }
            if (allowed && profile.bound_ip && profile.bound_ip.trim() !== '') {
              allowed = !!ip && ip === profile.bound_ip;
            }
            if (!allowed) {
              ok = false;
            } else {
              // Bind on first login if needed
              await AccessService.bindAdminIpIfNeeded(userId, ip);
            }
          }
        } catch {
          // On error, keep ok state
        }
      }
      setAuthed(ok);
      setChecking(false);
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthed(!!session);
      });
      unsub = () => subscription.subscription.unsubscribe();
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (checking) return null;
  if (!authed) return <Navigate to="/admin-login" replace />;
  return children;
}
