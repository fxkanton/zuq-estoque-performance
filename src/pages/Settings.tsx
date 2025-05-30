
import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Bell, Shield, Database } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    inventory: true,
    maintenance: true,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    shareActivity: false,
  });

  const handleSaveNotifications = () => {
    toast({
      title: 'Configurações salvas!',
      description: 'Suas preferências de notificações foram atualizadas.',
    });
  };

  const handleSavePrivacy = () => {
    toast({
      title: 'Configurações salvas!',
      description: 'Suas configurações de privacidade foram atualizadas.',
    });
  };

  return (
    <MainLayout title="Configurações">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Configurações</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Notificações por Email</Label>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Notificações Push</Label>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="inventory-notifications">Alertas de Estoque</Label>
                <Switch
                  id="inventory-notifications"
                  checked={notifications.inventory}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, inventory: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-notifications">Alertas de Manutenção</Label>
                <Switch
                  id="maintenance-notifications"
                  checked={notifications.maintenance}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, maintenance: checked }))
                  }
                />
              </div>
              
              <Button 
                onClick={handleSaveNotifications}
                className="w-full bg-zuq-blue hover:bg-zuq-blue/90"
              >
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-profile">Mostrar Perfil Público</Label>
                <Switch
                  id="show-profile"
                  checked={privacy.showProfile}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, showProfile: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="share-activity">Compartilhar Atividades</Label>
                <Switch
                  id="share-activity"
                  checked={privacy.shareActivity}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, shareActivity: checked }))
                  }
                />
              </div>
              
              <Button 
                onClick={handleSavePrivacy}
                className="w-full bg-zuq-blue hover:bg-zuq-blue/90"
              >
                Salvar Privacidade
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Versão do Sistema</p>
                <p className="text-gray-600">ZUQ v1.0.0</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Última Sincronização</p>
                <p className="text-gray-600">{new Date().toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Status do Banco</p>
                <p className="text-green-600">Conectado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
