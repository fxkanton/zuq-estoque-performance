
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  address?: string;
  phone?: string;
  contact_name?: string;
  email?: string;
  average_delivery_days?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');

  if (error) {
    toast.error('Erro ao carregar fornecedores', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados do fornecedor', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao criar fornecedor', {
      description: error.message
    });
    return null;
  }

  toast.success('Fornecedor criado com sucesso');
  return data;
};

export const updateSupplier = async (id: string, supplier: Partial<Supplier>): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar fornecedor', {
      description: error.message
    });
    return null;
  }

  toast.success('Fornecedor atualizado com sucesso');
  return data;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir fornecedor', {
      description: error.message
    });
    return false;
  }

  toast.success('Fornecedor excluído com sucesso');
  return true;
};

// Enable realtime updates for suppliers table
export const enableSupplierRealtime = () => {
  return supabase
    .channel('supplier-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'suppliers'
    }, () => {
      // This callback will be empty since we'll handle the refresh in the component
    })
    .subscribe();
};
