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
    return [];
  }
};

export const getMonthlyMovements = async (startDate?: string, endDate?: string): Promise<{
  entries: number;
  exits: number;
  entriesChange: number;
  exitsChange: number;
  entriesCount: number;
  exitsCount: number;
}> => {
  try {
    const now = new Date();
    // Current period
    const currentPeriodStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const currentPeriodEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format dates for Supabase query
    const currentStartStr = currentPeriodStart.toISOString();
    const currentEndStr = currentPeriodEnd.toISOString();
    
    // Previous period of equal duration
    const durationInDays = Math.round((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const prevPeriodEnd = new Date(currentPeriodStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - durationInDays);
    
    // Format dates for previous period
    const prevStartStr = prevPeriodStart.toISOString();
    const prevEndStr = prevPeriodEnd.toISOString();
    
    // Current period entries
    const { data: currentEntries, error: currentEntriesError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Entrada')
      .gte('movement_date', currentStartStr)
      .lte('movement_date', currentEndStr);
    
    // Current period exits
    const { data: currentExits, error: currentExitsError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Saída')
      .gte('movement_date', currentStartStr)
      .lte('movement_date', currentEndStr);
    
    // Previous period entries
    const { data: prevEntries, error: prevEntriesError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Entrada')
      .gte('movement_date', prevStartStr)
      .lte('movement_date', prevEndStr);
    
    // Previous period exits
    const { data: prevExits, error: prevExitsError } = await supabase
      .from('inventory_movements')
      .select('quantity')
      .eq('movement_type', 'Saída')
      .gte('movement_date', prevStartStr)
      .lte('movement_date', prevEndStr);
    
    if (currentEntriesError || currentExitsError || prevEntriesError || prevExitsError) {
      throw currentEntriesError || currentExitsError || prevEntriesError || prevExitsError;
    }
    
    // Count records
    const entriesCount = currentEntries?.length || 0;
    const exitsCount = currentExits?.length || 0;
    
    // Sum total quantities
    const currentEntriesTotal = currentEntries.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const currentExitsTotal = currentExits.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const prevEntriesTotal = prevEntries.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const prevExitsTotal = prevExits.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Calculate percentage change
    const entriesChange = prevEntriesTotal === 0 
      ? currentEntriesTotal > 0 ? 100 : 0 
      : ((currentEntriesTotal - prevEntriesTotal) / prevEntriesTotal) * 100;
      
    const exitsChange = prevExitsTotal === 0 
      ? currentExitsTotal > 0 ? 100 : 0 
      : ((currentExitsTotal - prevExitsTotal) / prevExitsTotal) * 100;
    
    return {
      entries: currentEntriesTotal,
      exits: currentExitsTotal,
      entriesChange,
      exitsChange,
      entriesCount,
      exitsCount
    };
  } catch (error) {
    console.error("Error getting monthly movements:", error);
    return {
      entries: 0,
      exits: 0,
      entriesChange: 0,
      exitsChange: 0,
      entriesCount: 0,
      exitsCount: 0
    };
  }
};
