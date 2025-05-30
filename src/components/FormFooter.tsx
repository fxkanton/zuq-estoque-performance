
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Calendar } from 'lucide-react';

const FormFooter = () => {
  const { profile } = useAuth();
  
  if (!profile) return null;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Criado por: <strong>{profile.full_name || 'Usuário'}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
};

export default FormFooter;
