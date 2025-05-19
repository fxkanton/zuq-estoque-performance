
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

// Helper function to validate status
const validateMaintenanceStatus = (status: string): MaintenanceStatus => {
  const validStatuses: MaintenanceStatus[] = [
    'Em Andamento', 
    'Aguardando Peças', 
    'Concluída', 
    'Cancelada'
  ];
  
  return validStatuses.includes(status as MaintenanceStatus) 
    ? status as MaintenanceStatus 
    : 'Em Andamento';
};

// Helper to convert record to MaintenanceWithEquipment with proper types
const convertToMaintenanceWithEquipment = (record: any): MaintenanceWithEquipment => {
  return {
    ...record,
    status: validateMaintenanceStatus(record.status)
  };
};

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

  return data ? data.map(convertToMaintenanceWithEquipment) : [];
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

  return data ? convertToMaintenanceWithEquipment(data) : null;
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
  return data ? { ...data, status: validateMaintenanceStatus(data.status) } : null;
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
  return data ? { ...data, status: validateMaintenanceStatus(data.status) } : null;
};

export const reopenMaintenance = async (id: string): Promise<Maintenance | null> => {
  const record = await getMaintenanceById(id);
  
  if (!record) {
    toast.error('Registro de manutenção não encontrado');
    return null;
  }
  
  // Update status to Em Andamento and clear completion date
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
    toast.error('Erro ao reabrir manutenção', {
      description: error.message
    });
    return null;
  }
  
  // Update readers status back to Em Manutenção
  await supabase
    .from('readers')
    .update({ status: 'Em Manutenção' })
    .eq('equipment_id', record.equipment_id)
    .eq('status', 'Disponível')
    .limit(record.quantity);
  
  toast.success('Manutenção reaberta com sucesso');
  return data ? { ...data, status: validateMaintenanceStatus(data.status) } : null;
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
