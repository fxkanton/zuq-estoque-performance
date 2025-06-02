import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users as UsersIcon, Shield, Calendar, RefreshCw } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'intruso' | 'membro' | 'gerente';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const Users = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'todos' | 'intruso' | 'membro' | 'gerente'>('todos');

  // Buscar todos os usuários
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Mutation para alterar role do usuário
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'intruso' | 'membro' | 'gerente' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário atualizado!',
        description: 'O tipo de usuário foi alterado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o tipo de usuário.',
        variant: 'destructive',
      });
    }
  });

  const handleRoleChange = (userId: string, newRole: 'intruso' | 'membro' | 'gerente') => {
    updateUserRole.mutate({ userId, newRole });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'gerente':
        return <Badge className="bg-purple-100 text-purple-800">Gerente</Badge>;
      case 'membro':
        return <Badge className="bg-green-100 text-green-800">Membro</Badge>;
      case 'intruso':
        return <Badge className="bg-red-100 text-red-800">Intruso</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'gerente': return 'border-l-purple-500';
      case 'membro': return 'border-l-green-500';
      case 'intruso': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const filteredUsers = users?.filter(user => {
    if (filter === 'todos') return true;
    return user.role === filter;
  }) || [];

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserStats = () => {
    if (!users) return { total: 0, intrusos: 0, membros: 0, gerentes: 0 };
    
    return {
      total: users.length,
      intrusos: users.filter(u => u.role === 'intruso').length,
      membros: users.filter(u => u.role === 'membro').length,
      gerentes: users.filter(u => u.role === 'gerente').length,
    };
  };

  const stats = getUserStats();

  if (isLoading) {
    return (
      <MainLayout title="Usuários">
        <div className="flex items-center justify-center h-64">
          <p>Carregando usuários...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Usuários">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Gerenciar Usuários</h1>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total de Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.gerentes}</p>
                  <p className="text-sm text-gray-600">Gerentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.membros}</p>
                  <p className="text-sm text-gray-600">Membros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.intrusos}</p>
                  <p className="text-sm text-gray-600">Intrusos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filtrar por tipo:</label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  <SelectItem value="gerente">Gerentes</SelectItem>
                  <SelectItem value="membro">Membros</SelectItem>
                  <SelectItem value="intruso">Intrusos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`border-l-4 ${getRoleColor(user.role)} bg-white p-4 rounded-lg border border-gray-200 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt="Avatar" />
                        ) : (
                          <AvatarFallback className="bg-zuq-blue text-white">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.full_name || 'Usuário Sem Nome'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {getRoleBadge(user.role)}
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Alterar tipo:</p>
                        <Select 
                          value={user.role} 
                          onValueChange={(newRole: 'intruso' | 'membro' | 'gerente') => handleRoleChange(user.id, newRole)}
                          disabled={updateUserRole.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="intruso">Intruso</SelectItem>
                            <SelectItem value="membro">Membro</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum usuário encontrado com o filtro selecionado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Users;
