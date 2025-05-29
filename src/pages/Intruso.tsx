
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, LogOut, Clock, RefreshCw } from 'lucide-react';

const Intruso = () => {
  const { signOut, profile, refreshProfile } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const handleRefreshProfile = async () => {
    await refreshProfile();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header with logout and refresh */}
        <div className="flex justify-end gap-2 mb-6">
          <Button 
            variant="outline" 
            onClick={handleRefreshProfile}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png" 
                alt="ZUQ Performance" 
                className="w-24 h-24"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-zuq-darkblue mb-2">
              ZUQ Performance
            </CardTitle>
            <p className="text-lg text-gray-600">
              Sistema de Gestão de Inventário
            </p>
          </CardHeader>
          
          <CardContent className="text-center space-y-8 pb-12">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-800 mb-2">
                Acesso Restrito
              </h2>
              <p className="text-amber-700 leading-relaxed">
                Olá <strong>{profile?.full_name || 'Usuário'}</strong>! Seu acesso está limitado. 
                Somente membros autorizados podem utilizar todas as funcionalidades do sistema.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <Mail className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Solicitar Liberação
              </h3>
              <p className="text-blue-700 mb-4">
                Se você é um membro da equipe, entre em contato com o suporte para solicitar a liberação do seu acesso.
              </p>
              <div className="space-y-2 text-sm text-blue-600">
                <p>📧 Email: suporte@zuqperformance.com</p>
                <p>📱 WhatsApp: (11) 99999-9999</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Conta criada em: {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500">
                ZUQ Performance © 2025 - Todos os direitos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Intruso;
