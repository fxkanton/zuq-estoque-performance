
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export type MaintenanceStatus = 'Em Andamento' | 'Concluído';

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  quantity: number;
  send_date: string;
  expected_completion_date?: string;
  completion_date?: string;
  status: MaintenanceStatus;
  notes?: string;
  technician_notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  equipment?: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
}

export const fetchMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      )
    `)
    .order('send_date', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance records:', error);
    toast.error('Erro ao carregar registros de manutenção');
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    status: item.status as MaintenanceStatus
  }));
};

export const createMaintenanceRecord = async (recordData: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'equipment'>): Promise<MaintenanceRecord | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({
      ...recordData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance record:', error);
    toast.error('Erro ao criar registro de manutenção');
    return null;
  }

  toast.success('Registro de manutenção criado com sucesso!');
  return {
    ...data,
    status: data.status as MaintenanceStatus
  };
};

export const updateMaintenanceRecord = async (id: string, recordData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(recordData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating maintenance record:', error);
    toast.error('Erro ao atualizar registro de manutenção');
    return null;
  }

  toast.success('Registro de manutenção atualizado com sucesso!');
  return {
    ...data,
    status: data.status as MaintenanceStatus
  };
};

export const deleteMaintenanceRecord = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting maintenance record:', error);
    toast.error('Erro ao excluir registro de manutenção');
    return false;
  }

  toast.success('Registro de manutenção excluído com sucesso!');
  return true;
};

export const completeMaintenanceRecord = async (id: string, technicianNotes?: string): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update({
      status: 'Concluído',
      completion_date: new Date().toISOString().split('T')[0],
      technician_notes: technicianNotes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error completing maintenance record:', error);
    toast.error('Erro ao concluir manutenção');
    return null;
  }

  toast.success('Manutenção concluída com sucesso!');
  return {
    ...data,
    status: data.status as MaintenanceStatus
  };
};

export const reopenMaintenanceRecord = async (id: string): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update({
      status: 'Em Andamento',
      completion_date: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error reopening maintenance record:', error);
    toast.error('Erro ao reabrir manutenção');
    return null;
  }

  toast.success('Manutenção reaberta com sucesso!');
  return {
    ...data,
    status: data.status as MaintenanceStatus
  };
};

export const adoptMaintenanceRecord = async (recordId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('maintenance_records')
    .update({ created_by: user.id })
    .eq('id', recordId);

  if (error) {
    console.error('Error adopting maintenance record:', error);
    toast.error('Erro ao adotar registro de manutenção');
    return false;
  }

  toast.success('Registro de manutenção adotado com sucesso!');
  return true;
};

// Dashboard helper functions
export const getMaintenceCount = async () => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('status', 'Em Andamento');

  if (error) {
    console.error('Error fetching maintenance count:', error);
    return 0;
  }

  return data?.length || 0;
};

// Legacy exports for backward compatibility
export const createMaintenance = createMaintenanceRecord;
export const updateMaintenance = updateMaintenanceRecord;
