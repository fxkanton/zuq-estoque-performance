
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ManagerRouteProps {
  children: React.ReactNode;
}

export const ManagerRoute = ({ children }: ManagerRouteProps) => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zuq-blue mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth/login" replace />;
  }

  if (profile.role === 'intruso') {
    return <Navigate to="/intruso" replace />;
  }

  if (profile.role !== 'gerente') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
