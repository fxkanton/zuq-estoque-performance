import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type EquipmentCategory = 'Leitora' | 'Sensor' | 'Rastreador' | 'Acessório';

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: EquipmentCategory;
  average_price?: number;
  min_stock?: number;
  supplier_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchEquipment = async (): Promise<Equipment[]> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('name');

  if (error) {
    toast.error('Erro ao carregar equipamentos', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados do equipamento', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createEquipment = async (equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from('equipment')
    .insert([equipment])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao criar equipamento', {
      description: error.message
    });
    return null;
  }

  toast.success('Equipamento criado com sucesso');
  return data;
};

export const updateEquipment = async (id: string, equipment: Partial<Equipment>): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from('equipment')
    .update(equipment)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar equipamento', {
      description: error.message
    });
    return null;
  }

  toast.success('Equipamento atualizado com sucesso');
  return data;
};

export const deleteEquipment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir equipamento', {
      description: error.message
    });
    return false;
  }

  toast.success('Equipamento excluído com sucesso');
  return true;
};

export const getEquipmentStock = async (): Promise<Array<{ equipment_id: string, total: number }>> => {
  const { data: movements, error: movementsError } = await supabase
    .from('inventory_movements')
    .select('equipment_id, movement_type, quantity');

  if (movementsError) {
    toast.error('Erro ao carregar estoque', {
      description: movementsError.message
    });
    return [];
  }

  const stockByEquipment = movements.reduce((acc: Record<string, number>, movement) => {
    const currentStock = acc[movement.equipment_id] || 0;
    if (movement.movement_type === 'Entrada') {
      acc[movement.equipment_id] = currentStock + movement.quantity;
    } else {
      acc[movement.equipment_id] = currentStock - movement.quantity;
    }
    return acc;
  }, {});

  return Object.entries(stockByEquipment).map(([equipment_id, total]) => ({
    equipment_id,
    total
  }));
};

export const getEquipmentWithStock = async (): Promise<Array<Equipment & { stock: number }>> => {
  const equipment = await fetchEquipment();
  const stockData = await getEquipmentStock();
  
  const stockMap = stockData.reduce((acc: Record<string, number>, item) => {
    acc[item.equipment_id] = item.total;
    return acc;
  }, {});
  
  return equipment.map(item => ({
    ...item,
    stock: stockMap[item.id] || 0
  }));
};

// Enable realtime updates for equipment table
export const enableEquipmentRealtime = () => {
  return supabase
    .channel('equipment-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'equipment'
    }, () => {
      // This callback will be empty since we'll handle the refresh in the component
    })
    .subscribe();
};
