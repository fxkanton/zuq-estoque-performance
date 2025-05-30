
import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Bell, Shield, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    lowStock: true,
    newOrders: true,
    maintenance: true,
  });

  const [privacy, setPrivacy] = useState({
    showActivity: true,
    allowDataExport: true,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: 'Configuração salva',
      description: 'Suas preferências de notificação foram atualizadas.',
    });
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: 'Configuração salva',
      description: 'Suas configurações de privacidade foram atualizadas.',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Exportação iniciada',
      description: 'Seus dados estão sendo preparados para download.',
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: 'Ação não disponível',
      description: 'Entre em contato com o suporte para excluir sua conta.',
      variant: 'destructive',
    });
  };

  return (
    <MainLayout title="Configurações">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Configurações</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por Email</Label>
                  <p className="text-sm text-gray-500">
                    Receba atualizações importantes por email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Notificações Push</Label>
                  <p className="text-sm text-gray-500">
                    Receba notificações em tempo real
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-stock-alerts">Alertas de Estoque Baixo</Label>
                  <p className="text-sm text-gray-500">
                    Seja notificado quando o estoque estiver baixo
                  </p>
                </div>
                <Switch
                  id="low-stock-alerts"
                  checked={notifications.lowStock}
                  onCheckedChange={(checked) => handleNotificationChange('lowStock', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-orders">Novos Pedidos</Label>
                  <p className="text-sm text-gray-500">
                    Notificações sobre novos pedidos
                  </p>
                </div>
                <Switch
                  id="new-orders"
                  checked={notifications.newOrders}
                  onCheckedChange={(checked) => handleNotificationChange('newOrders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-alerts">Alertas de Manutenção</Label>
                  <p className="text-sm text-gray-500">
                    Notificações sobre manutenções pendentes
                  </p>
                </div>
                <Switch
                  id="maintenance-alerts"
                  checked={notifications.maintenance}
                  onCheckedChange={(checked) => handleNotificationChange('maintenance', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacidade e Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade e Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-activity">Mostrar Atividade</Label>
                  <p className="text-sm text-gray-500">
                    Exibir sua atividade recente para outros usuários
                  </p>
                </div>
                <Switch
                  id="show-activity"
                  checked={privacy.showActivity}
                  onCheckedChange={(checked) => handlePrivacyChange('showActivity', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-data-export">Permitir Exportação de Dados</Label>
                  <p className="text-sm text-gray-500">
                    Permitir que você exporte seus dados pessoais
                  </p>
                </div>
                <Switch
                  id="allow-data-export"
                  checked={privacy.allowDataExport}
                  onCheckedChange={(checked) => handlePrivacyChange('allowDataExport', checked)}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  disabled={!privacy.allowDataExport}
                >
                  <Download className="h-4 w-4" />
                  Exportar Meus Dados
                </Button>

                <Button 
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Versão</p>
                <p className="text-gray-500">1.0.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Última Atualização</p>
                <p className="text-gray-500">30/05/2025</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Suporte</p>
                <p className="text-gray-500">suporte@zuqperformance.com</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <p className="text-green-600">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
