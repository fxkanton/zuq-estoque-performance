
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Equipment } from "./equipmentService";

export type MovementType = 'Entrada' | 'Saída';

export interface Movement {
  id: string;
  equipment_id: string;
  movement_type: MovementType;
  quantity: number;
  movement_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovementWithEquipment extends Movement {
  equipment: Equipment;
}

export const fetchMovements = async (): Promise<MovementWithEquipment[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('movement_date', { ascending: false });

  if (error) {
    toast.error('Erro ao carregar movimentações', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const createMovement = async (movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert([movement])
    .select()
    .single();

  if (error) {
    toast.error(`Erro ao registrar ${movement.movement_type.toLowerCase()}`, {
      description: error.message
    });
    return null;
  }

  toast.success(`${movement.movement_type} registrada com sucesso`);
  return data;
};

export const getMonthlyMovements = async (): Promise<{
  entries: number;
  exits: number;
  entriesChange: number;
  exitsChange: number;
}> => {
  // Get current month movements
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  
  // Get previous month movements
  const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  
  // Current month
  const { data: currentMonthData, error: currentError } = await supabase
    .from('inventory_movements')
    .select('movement_type, quantity')
    .gte('movement_date', firstDayOfMonth)
    .lte('movement_date', lastDayOfMonth);

  if (currentError) {
    toast.error('Erro ao carregar estatísticas de movimentação', {
      description: currentError.message
    });
    return { entries: 0, exits: 0, entriesChange: 0, exitsChange: 0 };
  }
  
  // Previous month
  const { data: prevMonthData, error: prevError } = await supabase
    .from('inventory_movements')
    .select('movement_type, quantity')
    .gte('movement_date', firstDayOfPrevMonth)
    .lte('movement_date', lastDayOfPrevMonth);

  if (prevError) {
    toast.error('Erro ao carregar estatísticas de movimentação', {
      description: prevError.message
    });
    return { entries: 0, exits: 0, entriesChange: 0, exitsChange: 0 };
  }
  
  // Calculate totals for current month
  let currentEntries = 0;
  let currentExits = 0;
  
  currentMonthData.forEach(item => {
    if (item.movement_type === 'Entrada') {
      currentEntries += item.quantity;
    } else {
      currentExits += item.quantity;
    }
  });
  
  // Calculate totals for previous month
  let prevEntries = 0;
  let prevExits = 0;
  
  prevMonthData.forEach(item => {
    if (item.movement_type === 'Entrada') {
      prevEntries += item.quantity;
    } else {
      prevExits += item.quantity;
    }
  });
  
  // Calculate percentage changes
  const entriesChange = prevEntries === 0 ? 100 : ((currentEntries - prevEntries) / prevEntries) * 100;
  const exitsChange = prevExits === 0 ? 0 : ((currentExits - prevExits) / prevExits) * 100;
  
  return {
    entries: currentEntries,
    exits: currentExits,
    entriesChange,
    exitsChange
  };
};

export const getRecentMovements = async (limit: number = 5): Promise<MovementWithEquipment[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent movements:', error);
    return [];
  }

  return data || [];
};
