
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Equipment } from "./equipmentService";

export type MaintenanceStatus = 'Em Andamento' | 'Aguardando Peças' | 'Concluída' | 'Cancelada';

export interface Maintenance {
  id: string;
  equipment_id: string;
  quantity: number;
  send_date: string;
  notes?: string;
  status: MaintenanceStatus;
  technician_notes?: string;
  expected_completion_date?: string;
  completion_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceWithEquipment extends Maintenance {
  equipment: Equipment;
}

export const fetchMaintenanceRecords = async (): Promise<MaintenanceWithEquipment[]> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('send_date', { ascending: false });

  if (error) {
    toast.error('Erro ao carregar registros de manutenção', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const getMaintenanceById = async (id: string): Promise<MaintenanceWithEquipment | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados de manutenção', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createMaintenance = async (maintenance: Omit<Maintenance, 'id' | 'created_at' | 'updated_at'>): Promise<Maintenance | null> => {
  // Set default status if not provided
  const dataToInsert = {
    ...maintenance,
    status: maintenance.status || 'Em Andamento'
  };

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert([dataToInsert])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao registrar manutenção', {
      description: error.message
    });
    return null;
  }

  // Also update reader status if applicable
  if (maintenance.equipment_id) {
    await supabase
      .from('readers')
      .update({ status: 'Em Manutenção' })
      .eq('equipment_id', maintenance.equipment_id)
      .limit(maintenance.quantity);
  }

  toast.success('Manutenção registrada com sucesso');
  return data;
};

export const updateMaintenance = async (id: string, maintenance: Partial<Maintenance>): Promise<Maintenance | null> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(maintenance)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar manutenção', {
      description: error.message
    });
    return null;
  }

  // If status is changed to Concluída, update readers status back to Disponível
  if (maintenance.status === 'Concluída') {
    const record = await getMaintenanceById(id);
    
    if (record) {
      await supabase
        .from('readers')
        .update({ status: 'Disponível' })
        .eq('equipment_id', record.equipment_id)
        .eq('status', 'Em Manutenção')
        .limit(record.quantity);
    }
  }

  toast.success('Manutenção atualizada com sucesso');
  return data;
};

export const getMaintenceCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('maintenance_records')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching maintenance count:', error);
    return 0;
  }

  return count || 0;
};
