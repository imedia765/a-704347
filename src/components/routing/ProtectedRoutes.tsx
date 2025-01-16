import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Loader2 } from "lucide-react";

interface ProtectedRoutesProps {
  session: Session | null;
}

const AuthWrapper = ({ session }: { session: Session | null }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { roleLoading, canAccessTab } = useRoleAccess();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change in router:', event);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !currentSession) {
        console.log('User signed out or token refresh failed, redirecting to login');
        navigate('/login', { replace: true });
      } else if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, redirecting to home');
        navigate('/', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Navigation error:', event.error);
      
      if (event.error?.name === 'ChunkLoadError' || event.message?.includes('Failed to fetch')) {
        toast({
          title: "Navigation Error",
          description: "There was a problem loading the page. Please try refreshing.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (
            canAccessTab('dashboard') ? (
              <Index />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-screen bg-dashboard-dark text-white">
                <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
                <p className="text-dashboard-muted">You don't have permission to access this page.</p>
              </div>
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={session ? "/" : "/login"} replace />
        }
      />
    </Routes>
  );
};

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  return (
    <BrowserRouter basename="/">
      <AuthWrapper session={session} />
    </BrowserRouter>
  );
};

export default ProtectedRoutes;