
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  average_delivery_days?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching suppliers:', error);
    toast.error('Erro ao carregar fornecedores');
    return [];
  }

  return data || [];
};

export const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Supplier | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      ...supplierData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    toast.error('Erro ao criar fornecedor');
    return null;
  }

  toast.success('Fornecedor criado com sucesso!');
  return data;
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplierData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier:', error);
    toast.error('Erro ao atualizar fornecedor');
    return null;
  }

  toast.success('Fornecedor atualizado com sucesso!');
  return data;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier:', error);
    toast.error('Erro ao excluir fornecedor');
    return false;
  }

  toast.success('Fornecedor excluído com sucesso!');
  return true;
};

export const adoptSupplier = async (supplierId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('suppliers')
    .update({ created_by: user.id })
    .eq('id', supplierId);

  if (error) {
    console.error('Error adopting supplier:', error);
    toast.error('Erro ao adotar fornecedor');
    return false;
  }

  toast.success('Fornecedor adotado com sucesso!');
  return true;
};
