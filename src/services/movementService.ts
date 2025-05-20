
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

// Helper function to validate movement type
const isValidMovementType = (type: string): type is MovementType => {
  return type === 'Entrada' || type === 'Saída';
};

// Helper function to convert database records to MovementWithEquipment
const convertToMovementWithEquipment = (record: any): MovementWithEquipment => {
  const movementType = isValidMovementType(record.movement_type) ? record.movement_type : 'Entrada';
  
  return {
    ...record,
    movement_type: movementType,
  };
};

// Fetch all movements
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

  return data ? data.map(convertToMovementWithEquipment) : [];
};

// Get movement by ID
export const getMovementById = async (id: string): Promise<MovementWithEquipment | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados da movimentação', {
      description: error.message
    });
    return null;
  }

  return data ? convertToMovementWithEquipment(data) : null;
};

// Create new movement
export const createMovement = async (movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert([{ 
      ...movement, 
      movement_type: isValidMovementType(movement.movement_type) ? movement.movement_type : 'Entrada'
    }])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao registrar movimentação', {
      description: error.message
    });
    return null;
  }

  toast.success('Movimentação registrada com sucesso');
  return data as Movement;
};

// Update movement
export const updateMovement = async (id: string, movement: Partial<Movement>): Promise<Movement | null> => {
  // Ensure that if movement_type is provided, it's valid
  const validatedMovement = { 
    ...movement,
    ...(movement.movement_type && { 
      movement_type: isValidMovementType(movement.movement_type) 
        ? movement.movement_type 
        : 'Entrada' 
    })
  };

  const { data, error } = await supabase
    .from('inventory_movements')
    .update(validatedMovement)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar movimentação', {
      description: error.message
    });
    return null;
  }

  toast.success('Movimentação atualizada com sucesso');
  return data as Movement;
};

// Delete movement
export const deleteMovement = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('inventory_movements')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir movimentação', {
      description: error.message
    });
    return false;
  }

  toast.success('Movimentação excluída com sucesso');
  return true;
};

// Get monthly movements with date range
export const getMonthlyMovements = async (startDate: string, endDate: string) => {
  // Get entries
  const { data: entriesData, error: entriesError } = await supabase
    .from('inventory_movements')
    .select('quantity')
    .eq('movement_type', 'Entrada')
    .gte('movement_date', startDate)
    .lte('movement_date', endDate);

  // Get exits
  const { data: exitsData, error: exitsError } = await supabase
    .from('inventory_movements')
    .select('quantity')
    .eq('movement_type', 'Saída')
    .gte('movement_date', startDate)
    .lte('movement_date', endDate);

  if (entriesError || exitsError) {
    console.error('Error fetching monthly movements:', entriesError || exitsError);
    return {
      entries: 0,
      exits: 0,
      entriesCount: 0,
      exitsCount: 0,
      entriesChange: 0,
      exitsChange: 0,
    };
  }

  const entries = entriesData.reduce((total, item) => total + item.quantity, 0);
  const exits = exitsData.reduce((total, item) => total + item.quantity, 0);

  return {
    entries,
    exits,
    entriesCount: entriesData.length,
    exitsCount: exitsData.length,
    entriesChange: 0, // This could be calculated if we have previous period data
    exitsChange: 0,   // This could be calculated if we have previous period data
  };
};

// Get recent movements
export const getRecentMovements = async (limit: number = 5): Promise<MovementWithEquipment[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('movement_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent movements:', error);
    return [];
  }

  return data ? data.map(convertToMovementWithEquipment) : [];
};

// Get equipment inventory by period
export const getEquipmentInventory = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      equipment_id,
      movement_type,
      quantity,
      equipment:equipment_id (name, model, brand)
    `)
    .gte('movement_date', startDate)
    .lte('movement_date', endDate);

  if (error) {
    console.error('Error fetching equipment inventory:', error);
    return [];
  }

  // Process data to get inventory levels by equipment
  const equipmentMap = new Map();
  
  data.forEach(movement => {
    const key = movement.equipment_id;
    if (!equipmentMap.has(key)) {
      equipmentMap.set(key, {
        id: movement.equipment_id,
        name: movement.equipment.name,
        model: movement.equipment.model,
        brand: movement.equipment.brand,
        stock: 0
      });
    }
    
    const equipment = equipmentMap.get(key);
    if (movement.movement_type === 'Entrada') {
      equipment.stock += movement.quantity;
    } else if (movement.movement_type === 'Saída') {
      equipment.stock -= movement.quantity;
    }
  });
  
  // Convert map to array and sort by stock (descending)
  return Array.from(equipmentMap.values())
    .sort((a, b) => b.stock - a.stock);
};
