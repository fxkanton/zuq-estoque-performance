import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface Movement {
  id: string;
  equipment_id: string;
  movement_type: string;
  quantity: number;
  movement_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovementWithEquipment extends Movement {
  equipment: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
}

export const fetchMovements = async (): Promise<MovementWithEquipment[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      )
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

export const getMovementById = async (id: string): Promise<MovementWithEquipment | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados da movimentação', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createMovement = async (movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert([movement])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao criar movimentação', {
      description: error.message
    });
    return null;
  }

  toast.success('Movimentação criada com sucesso');
  return data;
};

export const updateMovement = async (id: string, movement: Partial<Movement>): Promise<Movement | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .update(movement)
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
  return data;
};

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

export const getMonthlyMovements = async (): Promise<{ entries: number; exits: number; entriesChange: number; exitsChange: number; entriesCount: number; exitsCount: number }> => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .gte('movement_date', firstDayOfMonth)
    .lte('movement_date', lastDayOfMonth);

  if (error) {
    toast.error('Erro ao carregar movimentações mensais', {
      description: error.message
    });
    return { entries: 0, exits: 0, entriesChange: 0, exitsChange: 0, entriesCount: 0, exitsCount: 0 };
  }

  let entries = 0;
  let exits = 0;
  let entriesCount = 0;
  let exitsCount = 0;

  data.forEach(movement => {
    if (movement.movement_type === 'Entrada') {
      entries += movement.quantity;
      entriesCount++;
    } else {
      exits += movement.quantity;
      exitsCount++;
    }
  });

  return { entries, exits, entriesChange: 0, exitsChange: 0, entriesCount, exitsCount };
};

export const getRecentMovements = async (): Promise<MovementWithEquipment[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    toast.error('Erro ao carregar movimentações recentes', {
      description: error.message
    });
    return [];
  }

  return data || [];
};
