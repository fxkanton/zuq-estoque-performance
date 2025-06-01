
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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
  created_by?: string;
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
    console.error('Error fetching movements:', error);
    toast.error('Erro ao carregar movimentações');
    return [];
  }

  return data || [];
};

export const createMovement = async (movementData: Omit<Movement, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Movement | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      ...movementData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating movement:', error);
    toast.error('Erro ao criar movimentação');
    return null;
  }

  toast.success('Movimentação criada com sucesso!');
  return data;
};

export const updateMovement = async (id: string, movementData: Partial<Movement>): Promise<Movement | null> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .update(movementData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating movement:', error);
    toast.error('Erro ao atualizar movimentação');
    return null;
  }

  toast.success('Movimentação atualizada com sucesso!');
  return data;
};

export const deleteMovement = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('inventory_movements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting movement:', error);
    toast.error('Erro ao excluir movimentação');
    return false;
  }

  toast.success('Movimentação excluída com sucesso!');
  return true;
};

export const adoptMovement = async (movementId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('inventory_movements')
    .update({ created_by: user.id })
    .eq('id', movementId);

  if (error) {
    console.error('Error adopting movement:', error);
    toast.error('Erro ao adotar movimentação');
    return false;
  }

  toast.success('Movimentação adotada com sucesso!');
  return true;
};
