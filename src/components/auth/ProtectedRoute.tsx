
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { isMemberOrManager } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMember?: boolean;
}

export const ProtectedRoute = ({ children, requireMember = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zuq-blue" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Se requireMember for true, verificar se o usuário é membro ou gerente
  if (requireMember && profile && !isMemberOrManager(profile.role)) {
    return <Navigate to="/intruso" replace />;
  }

  return <>{children}</>;
};
