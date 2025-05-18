
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus, Search, FileText } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  fetchOrders, 
  createOrder, 
  updateOrder, 
  deleteOrder,
  fetchOrderBatches,
  createOrderBatch,
  OrderWithDetails,
  OrderBatch
} from "@/services/orderService";
import { fetchEquipment } from "@/services/equipmentService";
import { fetchSuppliers } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";

const Pedidos = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddBatchDialogOpen, setIsAddBatchDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected order for operations
  const [currentOrder, setCurrentOrder] = useState<OrderWithDetails | null>(null);
  const [orderBatches, setOrderBatches] = useState<OrderBatch[]>([]);
  
  // Form states
  const [orderFormData, setOrderFormData] = useState({
    equipment_id: '',
    supplier_id: '',
    quantity: 1,
    expected_arrival_date: '',
    invoice_number: '',
    notes: ''
  });
  
  const [batchFormData, setBatchFormData] = useState({
    shipping_date: '',
    tracking_code: '',
    received_date: '',
    received_quantity: 1,
    invoice_number: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      const ordersData = await fetchOrders();
      setOrders(ordersData);
      setFilteredOrders(ordersData);

      const equipmentData = await fetchEquipment();
      setEquipment(equipmentData);
      
      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading orders data:", error);
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
        if (currentOrder) {
          loadOrderBatches(currentOrder.id);
        }
        loadData(); // Also reload orders as status may have changed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(batchesChannel);
    };
  }, [currentOrder]);

  const loadOrderBatches = async (orderId: string) => {
    try {
      const batches = await fetchOrderBatches(orderId);
      setOrderBatches(batches);
    } catch (error) {
      console.error("Error loading order batches:", error);
    }
  };

  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      setOrderFormData(prev => ({
        ...prev,
        [id]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setOrderFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };
  
  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'received_quantity') {
      setBatchFormData(prev => ({
        ...prev,
        [id]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setBatchFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleOrderSelectChange = (field: string, value: string) => {
    setOrderFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetOrderForm = () => {
    setOrderFormData({
      equipment_id: '',
      supplier_id: '',
      quantity: 1,
      expected_arrival_date: '',
      invoice_number: '',
      notes: ''
    });
  };
  
  const resetBatchForm = () => {
    setBatchFormData({
      shipping_date: '',
      tracking_code: '',
      received_date: '',
      received_quantity: 1,
      invoice_number: '',
      notes: ''
    });
  };

  const handleOpenAddOrderDialog = () => {
    resetOrderForm();
    setIsAddDialogOpen(true);
  };
  
  const handleOpenViewDialog = (order: OrderWithDetails) => {
    setCurrentOrder(order);
    loadOrderBatches(order.id);
    setIsViewDialogOpen(true);
  };
  
  const handleOpenAddBatchDialog = () => {
    resetBatchForm();
    setIsAddBatchDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (order: OrderWithDetails) => {
    setCurrentOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateOrder = async () => {
    try {
      await createOrder(orderFormData);
      setIsAddDialogOpen(false);
      resetOrderForm();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };
  
  const handleCreateBatch = async () => {
    if (!currentOrder) return;
    
    try {
      await createOrderBatch({
        ...batchFormData,
        order_id: currentOrder.id
      });
      setIsAddBatchDialogOpen(false);
      resetBatchForm();
      loadOrderBatches(currentOrder.id); // Refresh batches
    } catch (error) {
      console.error("Error creating batch:", error);
    }
  };
  
  const handleDeleteOrder = async () => {
    if (!currentOrder) return;
    
    try {
      await deleteOrder(currentOrder.id);
      setIsDeleteDialogOpen(false);
      setCurrentOrder(null);
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  // Filter orders based on search term and status
  useEffect(() => {
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  // Calculate total received quantity for an order
  const calculateReceivedPercentage = (order: OrderWithDetails) => {
    const totalReceived = orderBatches.reduce((total, batch) => total + batch.received_quantity, 0);
    return (totalReceived / order.quantity) * 100;
  };

  return (
    <MainLayout title="Gestão de Pedidos">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Gestão de Pedidos</h1>
        <Button 
          className="bg-zuq-blue hover:bg-zuq-blue/80"
          onClick={handleOpenAddOrderDialog}
        >
          <Plus className="h-4 w-4 mr-2" /> Criar Novo Pedido
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar por produto, fornecedor..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Parcialmente Recebido">Parcialmente Recebido</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { 
                  setSearchTerm(''); 
                  setStatusFilter(''); 
                }}
              >
                Limpar
              </Button>
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1">Ver Histórico</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Previsão de Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          <ClipboardCheck className="h-4 w-4 text-zuq-blue" />
                        </div>
                        {order.equipment.name} {order.equipment.model}
                      </div>
                    </TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>
                      {order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenViewDialog(order)}
                        >
                          Detalhes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => handleOpenDeleteDialog(order)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Pedido</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo pedido
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="equipment_id">Equipamento</Label>
                <Select 
                  value={orderFormData.equipment_id} 
                  onValueChange={(value) => handleOrderSelectChange('equipment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="supplier_id">Fornecedor</Label>
                <Select 
                  value={orderFormData.supplier_id} 
                  onValueChange={(value) => handleOrderSelectChange('supplier_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={orderFormData.quantity}
                  onChange={handleOrderInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expected_arrival_date">Previsão de Entrega</Label>
                <Input 
                  id="expected_arrival_date" 
                  type="date"
                  value={orderFormData.expected_arrival_date}
                  onChange={handleOrderInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
              <Input 
                id="invoice_number" 
                placeholder="Se já disponível" 
                value={orderFormData.invoice_number}
                onChange={handleOrderInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais do pedido..." 
                value={orderFormData.notes}
                onChange={handleOrderInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleCreateOrder}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} className="max-w-4xl">
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Informações completas e acompanhamento do pedido
            </DialogDescription>
          </DialogHeader>
          
          {currentOrder && (
            <>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações do Pedido</h3>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Equipamento:</dt>
                      <dd className="text-sm font-medium">{currentOrder.equipment.name} {currentOrder.equipment.model}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Fornecedor:</dt>
                      <dd className="text-sm font-medium">{currentOrder.supplier.name}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Quantidade:</dt>
                      <dd className="text-sm font-medium">{currentOrder.quantity} unidades</dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Nota Fiscal:</dt>
                      <dd className="text-sm font-medium">{currentOrder.invoice_number || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Data do Pedido:</dt>
                      <dd className="text-sm font-medium">{new Date(currentOrder.created_at || '').toLocaleDateString('pt-BR')}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Previsão de Entrega:</dt>
                      <dd className="text-sm font-medium">
                        {currentOrder.expected_arrival_date ? new Date(currentOrder.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2">
                      <dt className="text-sm text-muted-foreground">Status:</dt>
                      <dd>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(currentOrder.status)}`}>
                          {currentOrder.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  
                  {currentOrder.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-1">Observações:</h4>
                      <p className="text-sm text-muted-foreground">{currentOrder.notes}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Progresso de Recebimento</h3>
                    <span className="text-sm text-muted-foreground">
                      {calculateReceivedPercentage(currentOrder).toFixed(0)}% concluído
                    </span>
                  </div>
                  <Progress value={calculateReceivedPercentage(currentOrder)} className="mb-6" />
                  
                  <Button 
                    className="w-full mb-4 bg-green-600 hover:bg-green-700" 
                    onClick={handleOpenAddBatchDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Registrar Nova Entrega
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="batches" className="mt-2">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="batches">Entregas Recebidas</TabsTrigger>
                  <TabsTrigger value="history">Histórico do Pedido</TabsTrigger>
                </TabsList>
                <TabsContent value="batches" className="pt-4">
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data de Recebimento</TableHead>
                          <TableHead className="text-center">Quantidade</TableHead>
                          <TableHead>Nota Fiscal</TableHead>
                          <TableHead>Código de Rastreio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderBatches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              Nenhuma entrega registrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          orderBatches.map((batch) => (
                            <TableRow key={batch.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="bg-green-100 p-1 rounded-full">
                                    <FileText className="h-3 w-3 text-green-600" />
                                  </div>
                                  {batch.received_date ? new Date(batch.received_date).toLocaleDateString('pt-BR') : 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{batch.received_quantity}</TableCell>
                              <TableCell>{batch.invoice_number || 'N/A'}</TableCell>
                              <TableCell>{batch.tracking_code || 'N/A'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="pt-4">
                  <div className="space-y-4">
                    <div className="border-l-2 border-green-500 pl-4 py-2">
                      <p className="text-sm font-medium">Pedido criado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(currentOrder.created_at || '').toLocaleDateString('pt-BR')} às {new Date(currentOrder.created_at || '').toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    
                    {orderBatches.map((batch, index) => (
                      <div key={batch.id} className="border-l-2 border-blue-500 pl-4 py-2">
                        <p className="text-sm font-medium">Entrega registrada - {batch.received_quantity} unidades</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.received_date ? new Date(batch.received_date).toLocaleDateString('pt-BR') : 'Data não informada'}
                        </p>
                      </div>
                    ))}
                    
                    {currentOrder.status === 'Recebido' && (
                      <div className="border-l-2 border-purple-500 pl-4 py-2">
                        <p className="text-sm font-medium">Pedido concluído</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(currentOrder.updated_at || '').toLocaleDateString('pt-BR')} às {new Date(currentOrder.updated_at || '').toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={isAddBatchDialogOpen} onOpenChange={setIsAddBatchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Entrega</DialogTitle>
            <DialogDescription>
              Informe os detalhes da entrega recebida
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="received_quantity">Quantidade Recebida</Label>
                <Input 
                  id="received_quantity" 
                  type="number"
                  min="1"
                  value={batchFormData.received_quantity}
                  onChange={handleBatchInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="received_date">Data de Recebimento</Label>
                <Input 
                  id="received_date" 
                  type="date"
                  value={batchFormData.received_date}
                  onChange={handleBatchInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="invoice_number">Nota Fiscal</Label>
                <Input 
                  id="invoice_number" 
                  placeholder="Número da NF" 
                  value={batchFormData.invoice_number}
                  onChange={handleBatchInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tracking_code">Código de Rastreio</Label>
                <Input 
                  id="tracking_code" 
                  placeholder="Se disponível" 
                  value={batchFormData.tracking_code}
                  onChange={handleBatchInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="shipping_date">Data de Envio</Label>
              <Input 
                id="shipping_date" 
                type="date"
                value={batchFormData.shipping_date}
                onChange={handleBatchInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes da entrega..." 
                value={batchFormData.notes}
                onChange={handleBatchInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddBatchDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateBatch}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentOrder && (
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-medium">{currentOrder.equipment.name} {currentOrder.equipment.model}</p>
                <p className="text-sm text-muted-foreground">
                  Fornecedor: {currentOrder.supplier.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Quantidade: {currentOrder.quantity} unidades
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Pendente':
      return 'bg-amber-100 text-amber-800';
    case 'Parcialmente Recebido':
      return 'bg-blue-100 text-blue-800';
    case 'Recebido':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default Pedidos;
