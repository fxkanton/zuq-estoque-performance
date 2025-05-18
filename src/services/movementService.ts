
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
