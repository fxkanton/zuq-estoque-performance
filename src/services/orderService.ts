import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export type OrderStatus = 'Pendente' | 'Parcialmente Recebido' | 'Recebido' | 'Cancelado';

export interface Order {
  id: string;
  equipment_id: string;
  supplier_id: string;
  quantity: number;
  status: OrderStatus;
  expected_arrival_date?: string;
  notes?: string;
  invoice_number?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  equipment?: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
  supplier?: {
    id: string;
    name: string;
    cnpj: string;
  };
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
    cnpj: string;
  };
}

export interface OrderBatch {
  id: string;
  order_id: string;
  received_quantity: number;
  received_date?: string;
  shipping_date?: string;
  tracking_code?: string;
  invoice_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const fetchOrders = async (showArchived: boolean = false): Promise<OrderWithDetails[]> => {
  const statusFilter = showArchived ? ['Cancelado'] : ['Pendente', 'Parcialmente Recebido', 'Recebido'];
  
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
        name,
        cnpj
      )
    `)
    .in('status', statusFilter as any)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    toast.error('Erro ao carregar pedidos');
    return [];
  }

  return (data || []).map(order => ({
    ...order,
    status: order.status as OrderStatus
  })) as OrderWithDetails[];
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'equipment' | 'supplier'>): Promise<Order | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      created_by: user?.id
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    toast.error('Erro ao criar pedido');
    return null;
  }

  toast.success('Pedido criado com sucesso!');
  return {
    ...data,
    status: data.status as OrderStatus
  } as Order;
};

export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .update(orderData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    toast.error('Erro ao atualizar pedido');
    return null;
  }

  toast.success('Pedido atualizado com sucesso!');
  return {
    ...data,
    status: data.status as OrderStatus
  } as Order;
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

// Order batch functions
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
    toast.error('Erro ao criar lote de recebimento');
    return null;
  }

  toast.success('Lote de recebimento criado com sucesso!');
  return data;
};

export const updateOrderBatch = async (id: string, batchData: Partial<OrderBatch>): Promise<OrderBatch | null> => {
  const { data, error } = await supabase
    .from('order_batches')
    .update(batchData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order batch:', error);
    toast.error('Erro ao atualizar recebimento');
    return null;
  }

  toast.success('Recebimento atualizado com sucesso!');
  return data;
};

export const deleteOrderBatch = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('order_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting order batch:', error);
    toast.error('Erro ao excluir recebimento');
    return false;
  }

  toast.success('Recebimento excluído com sucesso!');
  return true;
};

// Dashboard helper functions
export const getPendingOrders = async (): Promise<OrderWithDetails[]> => {
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
        name,
        cnpj
      )
    `)
    .in('status', ['Pendente', 'Parcialmente Recebido'] as any)
    .order('expected_arrival_date', { ascending: true });

  if (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }

  return (data || []).map(order => ({
    ...order,
    status: order.status as OrderStatus
  })) as OrderWithDetails[];
};

export const getOrderTotalReceived = async (orderId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('order_batches')
    .select('received_quantity')
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching order total received:', error);
    return 0;
  }

  return data?.reduce((total, batch) => total + batch.received_quantity, 0) || 0;
};

export const completeOrder = async (orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Recebido' } as any)
    .eq('id', orderId);

  if (error) {
    console.error('Error completing order:', error);
    toast.error('Erro ao finalizar pedido');
    return false;
  }

  toast.success('Pedido finalizado com sucesso!');
  return true;
};

export const archiveOrder = async (orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Cancelado' } as any)
    .eq('id', orderId);

  if (error) {
    console.error('Error archiving order:', error);
    toast.error('Erro ao arquivar pedido');
    return false;
  }

  toast.success('Pedido arquivado com sucesso!');
  return true;
};

export const unarchiveOrder = async (orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Pendente' } as any)
    .eq('id', orderId);

  if (error) {
    console.error('Error unarchiving order:', error);
    toast.error('Erro ao desarquivar pedido');
    return false;
  }

  toast.success('Pedido desarquivado com sucesso!');
  return true;
};
