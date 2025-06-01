
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export type EquipmentStatus = 'Disponível' | 'Em Uso' | 'Em Manutenção';
export type EquipmentCondition = 'Novo' | 'Recondicionado';

export interface Reader {
  id: string;
  code: string;
  equipment_id: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  acquisition_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ReaderWithEquipment extends Reader {
  equipment: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
}

export const fetchReaders = async (): Promise<ReaderWithEquipment[]> => {
  const { data, error } = await supabase
    .from('readers')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      )
    `)
    .order('code');

  if (error) {
    console.error('Error fetching readers:', error);
    toast.error('Erro ao carregar leitoras');
    return [];
  }

  return data || [];
};

export const createReader = async (readerData: Omit<Reader, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Reader | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('readers')
    .insert({
      ...readerData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating reader:', error);
    toast.error('Erro ao criar leitora');
    return null;
  }

  toast.success('Leitora criada com sucesso!');
  return data;
};

export const updateReader = async (id: string, readerData: Partial<Reader>): Promise<Reader | null> => {
  const { data, error } = await supabase
    .from('readers')
    .update(readerData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating reader:', error);
    toast.error('Erro ao atualizar leitora');
    return null;
  }

  toast.success('Leitora atualizada com sucesso!');
  return data;
};

export const deleteReader = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('readers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting reader:', error);
    toast.error('Erro ao excluir leitora');
    return false;
  }

  toast.success('Leitora excluída com sucesso!');
  return true;
};

export const adoptReader = async (readerId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('readers')
    .update({ created_by: user.id })
    .eq('id', readerId);

  if (error) {
    console.error('Error adopting reader:', error);
    toast.error('Erro ao adotar leitora');
    return false;
  }

  toast.success('Leitora adotada com sucesso!');
  return true;
};
