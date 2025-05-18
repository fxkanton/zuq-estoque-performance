
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "./equipmentService";

export type MovementType = "Entrada" | "Saída";

export interface Movement {
  id: string;
  equipment_id: string;
  quantity: number;
  movement_type: MovementType;
  movement_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovementWithEquipment extends Movement {
  equipment: Equipment;
}

export interface MovementFormData {
  equipment_id: string;
  quantity: number;
  movement_type: MovementType;
  movement_date: string;
  notes?: string;
}

export const fetchMovements = async (): Promise<MovementWithEquipment[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .order('movement_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Ensure movement_type is properly typed
    return data.map(movement => ({
      ...movement,
      movement_type: movement.movement_type as MovementType,
      equipment: movement.equipment as Equipment
    }));
  } catch (error) {
    console.error("Error fetching movements:", error);
    throw error;
  }
};

export const createMovement = async (movementData: MovementFormData): Promise<Movement> => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([movementData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Ensure movement_type is properly typed
    return {
      ...data,
      movement_type: data.movement_type as MovementType
    };
  } catch (error) {
    console.error("Error creating movement:", error);
    throw error;
  }
};

export const updateMovement = async (id: string, movementData: Partial<MovementFormData>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_movements')
      .update(movementData)
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating movement:", error);
    throw error;
  }
};

export const deleteMovement = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_movements')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting movement:", error);
    throw error;
  }
};

export const getMovementsByType = async (type: MovementType): Promise<MovementWithEquipment[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .eq('movement_type', type)
      .order('movement_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Ensure movement_type is properly typed
    return data.map(movement => ({
      ...movement,
      movement_type: movement.movement_type as MovementType,
      equipment: movement.equipment as Equipment
    }));
  } catch (error) {
    console.error(`Error fetching ${type} movements:`, error);
    throw error;
  }
};

export const getMovementSummary = async (): Promise<{ 
  totalEntradas: number;
  totalSaidas: number; 
  recentMovements: MovementWithEquipment[];
}> => {
  try {
    // Get counts
    const { data: entradaCount, error: entradaError } = await supabase
      .from('inventory_movements')
      .select('quantity', { count: 'exact', head: false })
      .eq('movement_type', 'Entrada');
    
    const { data: saidaCount, error: saidaError } = await supabase
      .from('inventory_movements')
      .select('quantity', { count: 'exact', head: false })
      .eq('movement_type', 'Saída');
    
    // Get recent movements
    const { data: recentData, error: recentError } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (entradaError || saidaError || recentError) {
      throw entradaError || saidaError || recentError;
    }

    // Ensure movement_type is properly typed in recent movements
    const typedRecentMovements = recentData.map(movement => ({
      ...movement,
      movement_type: movement.movement_type as MovementType,
      equipment: movement.equipment as Equipment
    }));

    return {
      totalEntradas: entradaCount?.length || 0,
      totalSaidas: saidaCount?.length || 0,
      recentMovements: typedRecentMovements
    };
  } catch (error) {
    console.error("Error getting movement summary:", error);
    throw error;
  }
};

// Adding the missing functions that Dashboard.tsx is trying to import

export const getRecentMovements = async (limit = 5): Promise<MovementWithEquipment[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(movement => ({
      ...movement,
      movement_type: movement.movement_type as MovementType,
      equipment: movement.equipment as Equipment
    }));
  } catch (error) {
    console.error("Error fetching recent movements:", error);
    throw error;
  }
};

export const getMonthlyMovements = async (): Promise<{
  entries: number;
  exits: number;
  entriesChange: number;
  exitsChange: number;
}> => {
  try {
    // Get current month data
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format dates for Supabase query
    const currentMonthStartStr = currentMonthStart.toISOString();
    const currentMonthEndStr = currentMonthEnd.toISOString();
    
    // Get previous month data
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Format dates for Supabase query
    const prevMonthStartStr = prevMonthStart.toISOString();
    const prevMonthEndStr = prevMonthEnd.toISOString();
    
    // Current month entries
    const { data: currentEntries, error: currentEntriesError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Entrada')
      .gte('movement_date', currentMonthStartStr)
      .lte('movement_date', currentMonthEndStr);
    
    // Current month exits
    const { data: currentExits, error: currentExitsError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Saída')
      .gte('movement_date', currentMonthStartStr)
      .lte('movement_date', currentMonthEndStr);
    
    // Previous month entries
    const { data: prevEntries, error: prevEntriesError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Entrada')
      .gte('movement_date', prevMonthStartStr)
      .lte('movement_date', prevMonthEndStr);
    
    // Previous month exits
    const { data: prevExits, error: prevExitsError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Saída')
      .gte('movement_date', prevMonthStartStr)
      .lte('movement_date', prevMonthEndStr);
    
    if (currentEntriesError || currentExitsError || prevEntriesError || prevExitsError) {
      throw currentEntriesError || currentExitsError || prevEntriesError || prevExitsError;
    }
    
    const currentEntriesCount = currentEntries?.length || 0;
    const currentExitsCount = currentExits?.length || 0;
    const prevEntriesCount = prevEntries?.length || 0;
    const prevExitsCount = prevExits?.length || 0;
    
    // Calculate percentage change
    const entriesChange = prevEntriesCount === 0 
      ? currentEntriesCount > 0 ? 100 : 0 
      : ((currentEntriesCount - prevEntriesCount) / prevEntriesCount) * 100;
      
    const exitsChange = prevExitsCount === 0 
      ? currentExitsCount > 0 ? 100 : 0 
      : ((currentExitsCount - prevExitsCount) / prevExitsCount) * 100;
    
    return {
      entries: currentEntriesCount,
      exits: currentExitsCount,
      entriesChange,
      exitsChange
    };
  } catch (error) {
    console.error("Error getting monthly movements:", error);
    return {
      entries: 0,
      exits: 0,
      entriesChange: 0,
      exitsChange: 0
    };
  }
};
