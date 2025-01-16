import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Loader2 } from "lucide-react";

interface AuthWrapperProps {
  session: Session | null;
  children: React.ReactNode;
}

const AuthWrapper = ({ session, children }: AuthWrapperProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { roleLoading, hasRole } = useRoleAccess();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change in router:', event);
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('User signed out or token refresh failed, redirecting to login');
        navigate('/login', { replace: true });
      } else if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, checking role access');
        if (!hasRole('member')) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this area.",
            variant: "destructive",
          });
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, hasRole, toast]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  if (!session) {
    navigate('/login', { replace: true });
    return null;
  }

  return <>{children}</>;
};

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/login', { replace: true });
          return;
        }
        
        setSession(currentSession);
      } catch (error) {
        console.error('Error initializing session:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <AuthWrapper session={session}>
      {children}
    </AuthWrapper>
  );
};

export default ProtectedRoutes;