
import { supabase } from "@/integrations/supabase/client";

export type MaintenanceStatus = 'Em Andamento' | 'Concluído' | 'Cancelado';

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  quantity: number;
  send_date: string;
  expected_completion_date: string;
  completion_date: string;
  status: MaintenanceStatus;
  notes: string;
  technician_notes: string;
  created_at: string;
  updated_at: string;
  equipment?: {
    id: string;
    name: string;
    model: string;
    brand: string;
  };
}

export interface MaintenanceWithEquipment extends MaintenanceRecord {
  equipment: {
    id: string;
    name: string;
    model: string;
    brand: string;
  };
}

export async function getMaintenceCount(): Promise<number> {
  const { count, error } = await supabase
    .from('maintenance_records')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error getting maintenance count:', error);
    return 0;
  }
  
  return count || 0;
}

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment:equipment_id (
        id, name, model, brand
      )
    `)
    .order('send_date', { ascending: false });
    
  if (error) {
    console.error('Error fetching maintenance records:', error);
    throw error;
  }
  
  return data as unknown as MaintenanceRecord[];
}

export async function getMaintenanceById(id: string): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment:equipment_id (
        id, name, model, brand
      )
    `)
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching maintenance record with id ${id}:`, error);
    throw error;
  }
  
  return data as unknown as MaintenanceRecord;
}

export async function createMaintenanceRecord(maintenanceData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert([maintenanceData])
    .select(`
      *,
      equipment:equipment_id (
        id, name, model, brand
      )
    `)
    .single();
    
  if (error) {
    console.error('Error creating maintenance record:', error);
    throw error;
  }
  
  return data as unknown as MaintenanceRecord;
}

export async function updateMaintenanceRecord(id: string, maintenanceData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(maintenanceData)
    .eq('id', id)
    .select(`
      *,
      equipment:equipment_id (
        id, name, model, brand
      )
    `)
    .single();
    
  if (error) {
    console.error(`Error updating maintenance record with id ${id}:`, error);
    throw error;
  }
  
  return data as unknown as MaintenanceRecord;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting maintenance record with id ${id}:`, error);
    throw error;
  }
}

export async function reopenMaintenanceRecord(id: string): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update({
      status: 'Em Andamento',
      completion_date: null
    })
    .eq('id', id)
    .select(`
      *,
      equipment:equipment_id (
        id, name, model, brand
      )
    `)
    .single();
    
  if (error) {
    console.error(`Error reopening maintenance record with id ${id}:`, error);
    throw error;
  }
  
  return data as unknown as MaintenanceRecord;
}
