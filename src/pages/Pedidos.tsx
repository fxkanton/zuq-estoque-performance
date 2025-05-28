import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Check, 
  List, 
  Archive, 
  ArchiveRestore,
  Trash2,
  Edit,
} from "lucide-react";
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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  fetchOrders, 
  createOrder, 
  updateOrder, 
  deleteOrder,
  getOrderTotalReceived,
  fetchOrderBatches,
  completeOrder,
  archiveOrder,
  unarchiveOrder,
  OrderWithDetails, 
  OrderStatus,
  OrderBatch
} from "@/services/orderService";
import { fetchEquipment } from "@/services/equipmentService";
import { fetchSuppliers } from "@/services/supplierService";
import OrderBatchForm from "@/components/OrderBatchForm";
import OrderBatchDetails from "@/components/OrderBatchDetails";
import { supabase } from "@/integrations/supabase/client";

const Pedidos = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiveBatchDialogOpen, setIsReceiveBatchDialogOpen] = useState(false);
  const [isBatchDetailsDialogOpen, setIsBatchDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderBatches, setOrderBatches] = useState<OrderBatch[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [orderReceivedAmounts, setOrderReceivedAmounts] = useState<Record<string, number>>({});
  
  // Form state
  const [currentOrder, setCurrentOrder] = useState<OrderWithDetails | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    supplier_id: '',
    quantity: 1,
    expected_arrival_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    notes: '',
    status: 'Pendente' as OrderStatus
  });

  const loadData = async () => {
    try {
      const ordersData = await fetchOrders(showArchived);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      
      const equipmentData = await fetchEquipment();
      setEquipment(equipmentData);
      
      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
      
      // Load received amounts for each order
      const receivedAmounts: Record<string, number> = {};
      for (const order of ordersData) {
        receivedAmounts[order.id] = await getOrderTotalReceived(order.id);
      }
      setOrderReceivedAmounts(receivedAmounts);
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

    const orderBatchesChannel = supabase
      .channel('public:order_batches')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_batches'
      }, () => {
        loadData();
        if (currentOrder) {
          loadOrderBatches(currentOrder.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderBatchesChannel);
    };
  }, [showArchived]);

  const loadOrderBatches = async (orderId: string) => {
    const batches = await fetchOrderBatches(orderId);
    setOrderBatches(batches);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      supplier_id: '',
      quantity: 1,
      expected_arrival_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      notes: '',
      status: 'Pendente'
    });
    setCurrentOrder(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (order: OrderWithDetails) => {
    setCurrentOrder(order);
    setFormData({
      equipment_id: order.equipment_id,
      supplier_id: order.supplier_id,
      quantity: order.quantity,
      expected_arrival_date: order.expected_arrival_date || new Date().toISOString().split('T')[0],
      invoice_number: order.invoice_number || '',
      notes: order.notes || '',
      status: order.status
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (order: OrderWithDetails) => {
    setCurrentOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenReceiveBatchDialog = (order: OrderWithDetails) => {
    setCurrentOrder(order);
    setIsReceiveBatchDialogOpen(true);
  };

  const handleOpenBatchDetailsDialog = async (order: OrderWithDetails) => {
    setCurrentOrder(order);
    await loadOrderBatches(order.id);
    setIsBatchDetailsDialogOpen(true);
  };

  const handleArchiveOrder = async (order: OrderWithDetails) => {
    if (await archiveOrder(order.id)) {
      loadData();
    }
  };

  const handleUnarchiveOrder = async (order: OrderWithDetails) => {
    if (await unarchiveOrder(order.id)) {
      loadData();
    }
  };

  const handleCompleteOrder = async (order: OrderWithDetails) => {
    if (await completeOrder(order.id)) {
      loadData();
    }
  };

  const handleSaveOrder = async () => {
    try {
      await createOrder(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder) return;
    
    try {
      await updateOrder(currentOrder.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!currentOrder) return;
    
    try {
      await deleteOrder(currentOrder.id);
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const calculateProgress = (order: OrderWithDetails): number => {
    const receivedAmount = orderReceivedAmounts[order.id] || 0;
    return Math.min(100, (receivedAmount / order.quantity) * 100);
  };

  const toggleShowArchived = () => {
    setShowArchived(prev => !prev);
  };

  // Filter orders based on search term and status
  useEffect(() => {
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  return (
    <MainLayout title="Controle de Pedidos">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">
          Controle de Pedidos {showArchived ? '(Arquivados)' : ''}
        </h1>
        <div className="flex gap-2">
          <Button 
            variant={showArchived ? "default" : "outline"}
            onClick={toggleShowArchived}
            className={showArchived ? "bg-zuq-blue hover:bg-zuq-blue/80" : ""}
          >
            {showArchived ? (
              <><ArchiveRestore className="h-4 w-4 mr-2" /> Pedidos Ativos</>
            ) : (
              <><Archive className="h-4 w-4 mr-2" /> Ver Arquivados</>
            )}
          </Button>
          
          {!showArchived && (
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80"
              onClick={handleOpenAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" /> Cadastrar Novo Pedido
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar por equipamento, fornecedor ou nota fiscal..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do Pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Parcialmente Recebido">Parcialmente Recebido</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  {showArchived && <SelectItem value="Arquivado">Arquivado</SelectItem>}
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
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1">Gerar Relatório</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Data do Pedido</TableHead>
                <TableHead>Previsão de Chegada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const receivedAmount = orderReceivedAmounts[order.id] || 0;
                  const progress = calculateProgress(order);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-zuq-gray/30 p-2 rounded-md">
                            <ClipboardCheck className="h-4 w-4 text-zuq-blue" />
                          </div>
                          {order.equipment.brand} {order.equipment.model}
                        </div>
                      </TableCell>
                      <TableCell>{order.supplier.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span>{order.quantity}</span>
                          {receivedAmount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({receivedAmount} recebidos)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-xs whitespace-nowrap">{Math.round(progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!showArchived && order.status !== 'Recebido' && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleOpenReceiveBatchDialog(order)}
                              title="Registrar Recebimento"
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleOpenBatchDetailsDialog(order)}
                            title="Ver Detalhes dos Recebimentos"
                            className="h-8 w-8 p-0"
                          >
                            <List className="h-3.5 w-3.5" />
                          </Button>
                          
                          {!showArchived && order.status !== 'Recebido' && receivedAmount >= order.quantity && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-green-500 h-8 w-8 p-0"
                              onClick={() => handleCompleteOrder(order)}
                              title="Concluir Pedido"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          {!showArchived && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(order)}
                              title="Editar Pedido"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                              
                          {showArchived ? (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleUnarchiveOrder(order)}
                              title="Desarquivar Pedido"
                              className="h-8 w-8 p-0"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            order.status !== 'Arquivado' && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleArchiveOrder(order)}
                                title="Arquivar Pedido"
                                className="h-8 w-8 p-0"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            )
                          )}
                              
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-red-500 h-8 w-8 p-0"
                            onClick={() => handleOpenDeleteDialog(order)}
                            title="Excluir Pedido"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Order Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Pedido</DialogTitle>
            <DialogDescription>
              Informe os detalhes do pedido para cadastro
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_id">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.brand} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier_id">Fornecedor</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => handleSelectChange('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expected_arrival_date">Previsão de Chegada</Label>
                <Input 
                  id="expected_arrival_date" 
                  type="date"
                  value={formData.expected_arrival_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice_number">Nota Fiscal</Label>
              <Input 
                id="invoice_number" 
                placeholder="Número da nota fiscal (opcional)" 
                value={formData.invoice_number}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais do pedido..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveOrder}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
            <DialogDescription>
              Atualize as informações do pedido
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-equipment">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.brand} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-supplier">Fornecedor</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => handleSelectChange('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expected_arrival_date">Previsão de Chegada</Label>
                <Input 
                  id="expected_arrival_date" 
                  type="date"
                  value={formData.expected_arrival_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice_number">Nota Fiscal</Label>
              <Input 
                id="invoice_number" 
                placeholder="Número da nota fiscal (opcional)" 
                value={formData.invoice_number}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Parcialmente Recebido">Parcialmente Recebido</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais do pedido..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateOrder}>Salvar</Button>
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
                <p className="font-medium">{currentOrder.equipment.brand} {currentOrder.equipment.model}</p>
                <p className="text-sm text-muted-foreground">
                  Fornecedor: {currentOrder.supplier.name} - Quantidade: {currentOrder.quantity}
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

      {/* Receive Batch Dialog */}
      {currentOrder && (
        <OrderBatchForm
          isOpen={isReceiveBatchDialogOpen}
          onClose={() => setIsReceiveBatchDialogOpen(false)}
          order={currentOrder}
          onSave={() => {
            setIsReceiveBatchDialogOpen(false);
            loadData();
          }}
        />
      )}

      {/* Batch Details Dialog */}
      {currentOrder && (
        <OrderBatchDetails
          isOpen={isBatchDetailsDialogOpen}
          onClose={() => setIsBatchDetailsDialogOpen(false)}
          order={currentOrder}
          batches={orderBatches}
          onRefresh={() => loadOrderBatches(currentOrder.id)}
        />
      )}
    </MainLayout>
  );
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Parcialmente Recebido':
      return 'bg-blue-100 text-blue-800';
    case 'Recebido':
      return 'bg-green-100 text-green-800';
    case 'Arquivado':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default Pedidos;
