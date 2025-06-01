
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export type OrderStatus = 'Pendente' | 'Parcialmente Recebido' | 'Recebido' | 'Arquivado';

export interface Order {
  id: string;
  equipment_id: string;
  supplier_id: string;
  quantity: number;
  expected_arrival_date?: string;
  invoice_number?: string;
  notes?: string;
  status?: OrderStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface OrderWithDetails extends Order {
  equipment: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
  supplier: {
    id: string;
    name: string;
  };
}

export interface OrderBatch {
  id: string;
  order_id: string;
  received_quantity: number;
  received_date?: string;
  invoice_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const fetchOrders = async (): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      equipment:equipment_id (
        id,
        brand,
        model,
        category
      ),
      supplier:supplier_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    toast.error('Erro ao carregar pedidos');
    return [];
  }

  return data || [];
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Order | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    toast.error('Erro ao criar pedido');
    return null;
  }

  toast.success('Pedido criado com sucesso!');
  return data;
};

export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .update(orderData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    toast.error('Erro ao atualizar pedido');
    return null;
  }

  toast.success('Pedido atualizado com sucesso!');
  return data;
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting order:', error);
    toast.error('Erro ao excluir pedido');
    return false;
  }

  toast.success('Pedido excluído com sucesso!');
  return true;
};

export const adoptOrder = async (orderId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('orders')
    .update({ created_by: user.id })
    .eq('id', orderId);

  if (error) {
    console.error('Error adopting order:', error);
    toast.error('Erro ao adotar pedido');
    return false;
  }

  toast.success('Pedido adotado com sucesso!');
  return true;
};

export const fetchOrderBatches = async (orderId: string): Promise<OrderBatch[]> => {
  const { data, error } = await supabase
    .from('order_batches')
    .select('*')
    .eq('order_id', orderId)
    .order('received_date', { ascending: false });

  if (error) {
    console.error('Error fetching order batches:', error);
    return [];
  }

  return data || [];
};

export const createOrderBatch = async (batchData: Omit<OrderBatch, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<OrderBatch | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('order_batches')
    .insert({
      ...batchData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order batch:', error);
    toast.error('Erro ao criar recebimento');
    return null;
  }

  toast.success('Recebimento registrado com sucesso!');
  return data;
};

export const adoptOrderBatch = async (batchId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    toast.error('Usuário não autenticado');
    return false;
  }

  const { error } = await supabase
    .from('order_batches')
    .update({ created_by: user.id })
    .eq('id', batchId);

  if (error) {
    console.error('Error adopting order batch:', error);
    toast.error('Erro ao adotar recebimento');
    return false;
  }

  toast.success('Recebimento adotado com sucesso!');
  return true;
};
