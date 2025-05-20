
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type MaintenanceStatus = 'Em Andamento' | 'Aguardando Peças' | 'Concluída' | 'Cancelada';

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  quantity: number;
  send_date: string;
  expected_completion_date?: string;
  completion_date?: string;
  status: MaintenanceStatus;
  technician_notes?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  equipment?: {
    id: string;
    name: string;
    model: string;
    brand: string;
  };
}

export const fetchMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, equipment(*)')
    .order('send_date', { ascending: false });

  if (error) {
    toast.error('Erro ao carregar registros de manutenção', {
      description: error.message
    });
    return [];
  }

  return data as MaintenanceRecord[] || [];
};

export const getMaintenanceRecordById = async (id: string): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, equipment(*)')
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar registro de manutenção', {
      description: error.message
    });
    return null;
  }

  return data as MaintenanceRecord;
};

export const createMaintenance = async (maintenance: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at' | 'equipment'>): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert([maintenance])
    .select('*, equipment(*)')
    .single();

  if (error) {
    toast.error('Erro ao criar registro de manutenção', {
      description: error.message
    });
    return null;
  }

  toast.success('Registro de manutenção criado com sucesso');
  return data as MaintenanceRecord;
};

export const updateMaintenance = async (id: string, maintenance: Partial<MaintenanceRecord>): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(maintenance)
    .eq('id', id)
    .select('*, equipment(*)')
    .single();

  if (error) {
    toast.error('Erro ao atualizar registro de manutenção', {
      description: error.message
    });
    return null;
  }

  toast.success('Registro de manutenção atualizado com sucesso');
  return data as MaintenanceRecord;
};

export const completeMaintenance = async (id: string, completionDate: string, technicianNotes?: string): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update({
      status: 'Concluída' as MaintenanceStatus,
      completion_date: completionDate,
      technician_notes: technicianNotes
    })
    .eq('id', id)
    .select('*, equipment(*)')
    .single();

  if (error) {
    toast.error('Erro ao concluir manutenção', {
      description: error.message
    });
    return null;
  }

  toast.success('Manutenção concluída com sucesso');
  return data as MaintenanceRecord;
};

export const reopenMaintenance = async (id: string): Promise<MaintenanceRecord | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update({
      status: 'Em Andamento' as MaintenanceStatus,
      completion_date: null
    })
    .eq('id', id)
    .select('*, equipment(*)')
    .single();

  if (error) {
    toast.error('Erro ao reabrir manutenção', {
      description: error.message
    });
    return null;
  }

  toast.success('Manutenção reaberta com sucesso');
  return data as MaintenanceRecord;
};

export const deleteMaintenance = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir manutenção', {
      description: error.message
    });
    return false;
  }

  toast.success('Manutenção excluída com sucesso');
  return true;
};

export const getMaintenceCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('maintenance_records')
    .select('*', { count: 'exact', head: true });

  if (error) {
    toast.error('Erro ao carregar contagem de manutenções', {
      description: error.message
    });
    return 0;
  }

  return count || 0;
};

// Enable realtime updates for maintenance records
export const enableMaintenanceRealtime = () => {
  return supabase
    .channel('maintenance-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'maintenance_records'
    }, () => {
      // This callback will be empty since we'll handle the refresh in the component
    })
    .subscribe();
};
