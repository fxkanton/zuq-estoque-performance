import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, CheckCircle, Receipt, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  fetchOrders, 
  createOrder, 
  updateOrder,
  deleteOrder,
  OrderWithDetails,
  OrderStatus,
  fetchOrderBatches,
  getOrderTotalReceived,
  OrderBatch
} from "@/services/orderService";
import { fetchEquipment } from "@/services/equipmentService";
import { fetchSuppliers } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";
import OrderBatchForm from "@/components/OrderBatchForm";
import OrderBatchDetails from "@/components/OrderBatchDetails";

interface Equipment {
  id: string;
  brand: string;
  model: string;
  category: string;
}

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
}

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orderBatches, setOrderBatches] = useState<{[key: string]: OrderBatch[]}>({});
  const [orderProgress, setOrderProgress] = useState<{[key: string]: number}>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithDetails | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    equipment_id: '',
    supplier_id: '',
    quantity: 1,
    expected_arrival_date: '',
    notes: ''
  });

  const loadOrderProgress = async (orderId: string) => {
    const totalReceived = await getOrderTotalReceived(orderId);
    return totalReceived;
  };

  const loadOrderBatches = async (orderId: string) => {
    const batches = await fetchOrderBatches(orderId);
    return batches;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, equipmentData, suppliersData] = await Promise.all([
        fetchOrders(),
        fetchEquipment(),
        fetchSuppliers()
      ]);
      
      setOrders(ordersData);
      setEquipment(equipmentData);
      setSuppliers(suppliersData);

      // Load progress and batches for each order
      const progressPromises = ordersData.map(async (order) => {
        const [totalReceived, batches] = await Promise.all([
          loadOrderProgress(order.id),
          loadOrderBatches(order.id)
        ]);
        return { orderId: order.id, totalReceived, batches };
      });

      const progressResults = await Promise.all(progressPromises);
      
      const newOrderProgress: {[key: string]: number} = {};
      const newOrderBatches: {[key: string]: OrderBatch[]} = {};
      
      progressResults.forEach(({ orderId, totalReceived, batches }) => {
        newOrderProgress[orderId] = totalReceived;
        newOrderBatches[orderId] = batches;
      });

      setOrderProgress(newOrderProgress);
      setOrderBatches(newOrderBatches);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const ordersChannel = supabase
      .channel('public:orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        loadData();
      })
      .subscribe();

    const batchesChannel = supabase
      .channel('public:order_batches')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_batches'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(batchesChannel);
    };
  }, []);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "Pendente":
        return <Package className="h-4 w-4" />;
      case "Parcialmente Recebido":
        return <Truck className="h-4 w-4" />;
      case "Recebido":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      "Pendente": "bg-yellow-100 text-yellow-800",
      "Parcialmente Recebido": "bg-blue-100 text-blue-800", 
      "Recebido": "bg-green-100 text-green-800",
      "Cancelado": "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getProgressPercentage = (order: OrderWithDetails) => {
    const totalReceived = orderProgress[order.id] || 0;
    return Math.round((totalReceived / order.quantity) * 100);
  };

  const filteredOrders = activeTab === "todos" 
    ? orders 
    : orders.filter(order => {
        switch (activeTab) {
          case "pendente":
            return order.status === "Pendente";
          case "em-trânsito":
            return order.status === "Parcialmente Recebido";
          case "entregue":
            return order.status === "Recebido";
          default:
            return true;
        }
      });

  const handleInputChange = (field: string, value: string | number) => {
    if (editingOrder) {
      setEditingOrder(prev => prev ? ({
        ...prev,
        [field]: value
      }) : null);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      supplier_id: '',
      quantity: 1,
      expected_arrival_date: '',
      notes: ''
    });
  };

  const handleCreateOrder = async () => {
    if (!formData.equipment_id || !formData.supplier_id || formData.quantity < 1) {
      return;
    }

    const result = await createOrder({
      equipment_id: formData.equipment_id,
      supplier_id: formData.supplier_id,
      quantity: formData.quantity,
      status: "Pendente",
      expected_arrival_date: formData.expected_arrival_date || undefined,
      notes: formData.notes || undefined
    });

    if (result) {
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    }
  };

  const handleEditOrder = (order: OrderWithDetails) => {
    setEditingOrder({
      ...order,
      expected_arrival_date: order.expected_arrival_date || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    const result = await updateOrder(editingOrder.id, {
      equipment_id: editingOrder.equipment_id,
      supplier_id: editingOrder.supplier_id,
      quantity: editingOrder.quantity,
      expected_arrival_date: editingOrder.expected_arrival_date || undefined,
      notes: editingOrder.notes || undefined
    });

    if (result) {
      setIsEditDialogOpen(false);
      setEditingOrder(null);
      loadData();
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    const result = await deleteOrder(orderToDelete.id);
    
    if (result) {
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadData();
    }
  };

  const handleRegisterReceipt = (order: OrderWithDetails) => {
    setSelectedOrderForBatch(order);
    setIsBatchFormOpen(true);
  };

  const handleBatchSave = () => {
    setIsBatchFormOpen(false);
    setSelectedOrderForBatch(null);
    loadData();
  };

  const handleViewDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsBatchDetailsOpen(true);
  };

  const handleRefreshBatches = async () => {
    if (selectedOrder) {
      await loadData();
    }
  };

  const getEquipmentLabel = (order: OrderWithDetails) => {
    return `${order.equipment.brand} ${order.equipment.model}`;
  };

  return (
    <MainLayout title="Pedidos de Equipamentos">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Controle de Pedidos</h1>
          
          <div className="flex justify-start">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/90 text-white flex items-center gap-2 w-full sm:w-auto"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="em-trânsito">Em Trânsito</TabsTrigger>
            <TabsTrigger value="entregue">Entregues</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Package className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground text-center">
                    Carregando pedidos...
                  </p>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Nenhum pedido encontrado para esta categoria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => {
                  const progressPercentage = getProgressPercentage(order);
                  const totalReceived = orderProgress[order.id] || 0;
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg cursor-pointer" onClick={() => handleViewDetails(order)}>
                            {getEquipmentLabel(order)}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {order.status !== "Recebido" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRegisterReceipt(order)}
                                className="flex items-center gap-1"
                              >
                                <Receipt className="h-3 w-3" />
                                Registrar Recebimento
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setOrderToDelete(order);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Fornecedor</p>
                            <p className="font-medium">{order.supplier.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data do Pedido</p>
                            <p className="font-medium">
                              {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                            <p className="font-medium">
                              {order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'Não definida'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                              Progresso: <span className="font-semibold text-zuq-blue">{totalReceived} de {order.quantity}</span>
                            </p>
                            <p className="text-sm font-semibold text-zuq-blue">{progressPercentage}%</p>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Order Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Pedido</DialogTitle>
              <DialogDescription>
                Crie um novo pedido de equipamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="equipment_id">Equipamento *</Label>
                <Select value={formData.equipment_id} onValueChange={(value) => handleInputChange('equipment_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.brand} {item.model} ({item.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="supplier_id">Fornecedor *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => handleInputChange('supplier_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="expected_arrival_date">Entrega Prevista</Label>
                  <Input
                    id="expected_arrival_date"
                    type="date"
                    value={formData.expected_arrival_date}
                    onChange={(e) => handleInputChange('expected_arrival_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre o pedido..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-zuq-blue hover:bg-zuq-blue/80"
                onClick={handleCreateOrder}
                disabled={!formData.equipment_id || !formData.supplier_id || formData.quantity < 1}
              >
                Criar Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Pedido</DialogTitle>
              <DialogDescription>
                Edite as informações do pedido
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_equipment_id">Equipamento *</Label>
                <Select 
                  value={editingOrder?.equipment_id || ''} 
                  onValueChange={(value) => handleInputChange('equipment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.brand} {item.model} ({item.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_supplier_id">Fornecedor *</Label>
                <Select 
                  value={editingOrder?.supplier_id || ''} 
                  onValueChange={(value) => handleInputChange('supplier_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_quantity">Quantidade *</Label>
                  <Input
                    id="edit_quantity"
                    type="number"
                    min="1"
                    value={editingOrder?.quantity || 1}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_expected_arrival_date">Entrega Prevista</Label>
                  <Input
                    id="edit_expected_arrival_date"
                    type="date"
                    value={editingOrder?.expected_arrival_date || ''}
                    onChange={(e) => handleInputChange('expected_arrival_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_notes">Observações</Label>
                <Textarea
                  id="edit_notes"
                  placeholder="Observações sobre o pedido..."
                  value={editingOrder?.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-zuq-blue hover:bg-zuq-blue/80"
                onClick={handleUpdateOrder}
                disabled={!editingOrder?.equipment_id || !editingOrder?.supplier_id || (editingOrder?.quantity || 0) < 1}
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            {orderToDelete && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Pedido:</strong> {getEquipmentLabel(orderToDelete)}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Fornecedor:</strong> {orderToDelete.supplier.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Quantidade:</strong> {orderToDelete.quantity}
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteOrder}
              >
                Excluir Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Form for registering receipts */}
        {selectedOrderForBatch && (
          <OrderBatchForm
            order={selectedOrderForBatch}
            isOpen={isBatchFormOpen}
            onClose={() => {
              setIsBatchFormOpen(false);
              setSelectedOrderForBatch(null);
            }}
            onSave={handleBatchSave}
          />
        )}

        {/* Batch Details for viewing receipt history */}
        {selectedOrder && (
          <OrderBatchDetails
            order={selectedOrder}
            batches={orderBatches[selectedOrder.id] || []}
            isOpen={isBatchDetailsOpen}
            onClose={() => {
              setIsBatchDetailsOpen(false);
              setSelectedOrder(null);
            }}
            onRefresh={handleRefreshBatches}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Pedidos;
