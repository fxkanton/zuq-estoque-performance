
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMember?: boolean;
}

export const ProtectedRoute = ({ children, requireMember = false }: ProtectedRouteProps) => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const location = useLocation();

  // Refresh profile when component mounts to get latest data
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Se a rota requer membro mas o usuário é intruso
  if (requireMember && profile?.role === 'intruso') {
    return <Navigate to="/intruso" replace />;
  }

  // Se o usuário é membro ou gerente mas está na página de intruso, redireciona para dashboard
  if ((profile?.role === 'membro' || profile?.role === 'gerente') && location.pathname === '/intruso') {
    return <Navigate to="/dashboard" replace />;
  }

  // Se o usuário é intruso e não está na página de intruso nem nas rotas de auth, redireciona
  if (profile?.role === 'intruso' && !location.pathname.startsWith('/auth') && location.pathname !== '/intruso') {
    return <Navigate to="/intruso" replace />;
  }

  return <>{children}</>;
};
