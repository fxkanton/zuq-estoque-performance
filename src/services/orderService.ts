
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Equipment } from "./equipmentService";
import { Supplier } from "./supplierService";

export type OrderStatus = 'Pendente' | 'Parcialmente Recebido' | 'Recebido';

export interface Order {
  id: string;
  equipment_id: string;
  supplier_id: string;
  quantity: number;
  expected_arrival_date?: string;
  invoice_number?: string;
  notes?: string;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
}

export interface OrderWithDetails extends Order {
  equipment: Equipment;
  supplier: Supplier;
}

export interface OrderBatch {
  id: string;
  order_id: string;
  shipping_date?: string;
  tracking_code?: string;
  received_date?: string;
  received_quantity: number;
  invoice_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchOrders = async (): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      equipment:equipment_id (*),
      supplier:supplier_id (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    toast.error('Erro ao carregar pedidos', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const getOrderById = async (id: string): Promise<OrderWithDetails | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      equipment:equipment_id (*),
      supplier:supplier_id (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados do pedido', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ ...order, status: 'Pendente' }])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao criar pedido', {
      description: error.message
    });
    return null;
  }

  toast.success('Pedido criado com sucesso');
  return data;
};

export const updateOrder = async (id: string, order: Partial<Order>): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .update(order)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error('Erro ao atualizar pedido', {
      description: error.message
    });
    return null;
  }

  toast.success('Pedido atualizado com sucesso');
  return data;
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir pedido', {
      description: error.message
    });
    return false;
  }

  toast.success('Pedido excluído com sucesso');
  return true;
};

export const fetchOrderBatches = async (orderId: string): Promise<OrderBatch[]> => {
  const { data, error } = await supabase
    .from('order_batches')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    toast.error('Erro ao carregar lotes do pedido', {
      description: error.message
    });
    return [];
  }

  return data || [];
};

export const createOrderBatch = async (batch: Omit<OrderBatch, 'id' | 'created_at' | 'updated_at'>): Promise<OrderBatch | null> => {
  const { data, error } = await supabase
    .from('order_batches')
    .insert([batch])
    .select()
    .single();

  if (error) {
    toast.error('Erro ao registrar lote', {
      description: error.message
    });
    return null;
  }

  toast.success('Lote registrado com sucesso');
  return data;
};

export const getPendingOrders = async (limit: number = 3): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      equipment:equipment_id (*),
      supplier:supplier_id (*)
    `)
    .not('status', 'eq', 'Recebido')
    .order('expected_arrival_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }

  return data || [];
};

export const getOrdersStats = async (): Promise<{ pendingCount: number, partialCount: number, receivedCount: number }> => {
  const { data, error } = await supabase
    .from('orders')
    .select('status');

  if (error) {
    console.error('Error fetching orders stats:', error);
    return { pendingCount: 0, partialCount: 0, receivedCount: 0 };
  }

  let pendingCount = 0;
  let partialCount = 0;
  let receivedCount = 0;

  data.forEach(order => {
    if (order.status === 'Pendente') pendingCount++;
    if (order.status === 'Parcialmente Recebido') partialCount++;
    if (order.status === 'Recebido') receivedCount++;
  });

  return { pendingCount, partialCount, receivedCount };
};
