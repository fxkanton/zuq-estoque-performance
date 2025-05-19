
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Equipment } from "./equipmentService";

export type EquipmentCondition = 'Novo' | 'Recondicionado';
export type EquipmentStatus = 'Disponível' | 'Em Uso' | 'Em Manutenção';

export interface Reader {
  id: string;
  code: string;
  equipment_id: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  acquisition_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReaderWithEquipment extends Reader {
  equipment: Equipment;
}

export const fetchReaders = async (): Promise<ReaderWithEquipment[]> => {
  const { data, error } = await supabase
    .from('readers')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .order('code');

  if (error) {
    toast.error('Erro ao carregar leitoras', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const getReaderById = async (id: string): Promise<ReaderWithEquipment | null> => {
  const { data, error } = await supabase
    .from('readers')
    .select(`
      *,
      equipment:equipment_id (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados da leitora', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createReader = async (reader: Omit<Reader, 'id' | 'created_at' | 'updated_at'>): Promise<Reader | null> => {
  const { data, error } = await supabase
    .from('readers')
    .insert([reader])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao criar leitora', {
      description: error.message
    });
    return null;
  }

  toast.success('Leitora criada com sucesso');
  return data;
};

export const updateReader = async (id: string, reader: Partial<Reader>): Promise<Reader | null> => {
  const { data, error } = await supabase
    .from('readers')
    .update(reader)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar leitora', {
      description: error.message
    });
    return null;
  }

  toast.success('Leitora atualizada com sucesso');
  return data;
};

export const deleteReader = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('readers')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir leitora', {
      description: error.message
    });
    return false;
  }

  toast.success('Leitora excluída com sucesso');
  return true;
};

export const getReadersByStatus = async (): Promise<Record<EquipmentStatus, number>> => {
  const { data, error } = await supabase
    .from('readers')
    .select('status');

  if (error) {
    toast.error('Erro ao carregar estatísticas de leitoras', {
      description: error.message
    });
    return {
      'Disponível': 0,
      'Em Uso': 0,
      'Em Manutenção': 0
    };
  }

  const counts: Record<EquipmentStatus, number> = {
    'Disponível': 0,
    'Em Uso': 0,
    'Em Manutenção': 0
  };

  data.forEach(reader => {
    counts[reader.status] = (counts[reader.status] || 0) + 1;
  });

  return counts;
};
