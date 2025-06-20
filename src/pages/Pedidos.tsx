
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, FileText } from "lucide-react";
import { fetchOrders, OrderWithDetails, getOrderTotalReceived } from "@/services/orderService";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";
import { DataExportDialog } from "@/components/export/DataExportDialog";
import OrderViewDialog from "@/components/orders/OrderViewDialog";
import OrderFormDialog from "@/components/orders/OrderFormDialog";
import OrderProgressBadge from "@/components/orders/OrderProgressBadge";

const Pedidos = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [orderProgress, setOrderProgress] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Estados para os dialogs
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadOrderProgress = async (orderIds: string[]) => {
    const progressData: Record<string, number> = {};
    
    await Promise.all(
      orderIds.map(async (orderId) => {
        try {
          const received = await getOrderTotalReceived(orderId);
          progressData[orderId] = received;
        } catch (error) {
          console.error(`Error loading progress for order ${orderId}:`, error);
          progressData[orderId] = 0;
        }
      })
    );
    
    setOrderProgress(progressData);
  };

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
      setFilteredOrders(data);
      
      // Load progress for all orders
      const orderIds = data.map(order => order.id);
      await loadOrderProgress(orderIds);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.equipment?.brand && order.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.equipment?.model && order.equipment.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.supplier?.name && order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Parcialmente Recebido':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Recebido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  // Handlers para os dialogs
  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setIsEditDialogOpen(true);
  };

  const handleOrderUpdated = () => {
    loadOrders();
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedOrder(null);
  };

  if (!isMemberOrManager(profile?.role)) {
    return (
      <MainLayout title="Pedidos">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a membros e gerentes.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Pedidos">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Pedidos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Pedidos</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80"
              onClick={handleNewOrder}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Pedido
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" /> Exportar Dados
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtrar Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por equipamento, fornecedor ou nota fiscal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Parcialmente Recebido">Parcialmente Recebido</SelectItem>
                    <SelectItem value="Recebido">Recebido</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar
                </Button>
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
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum pedido encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 h-12 w-12 flex items-center justify-center rounded-md">
                            <Package className="h-6 w-6 text-zuq-blue" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {order.equipment ? 
                                `${order.equipment.brand} ${order.equipment.model}` : 
                                'Equipamento não encontrado'
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.supplier?.name || 'Fornecedor não encontrado'}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        <OrderProgressBadge
                          totalQuantity={order.quantity}
                          receivedQuantity={orderProgress[order.id] || 0}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeStyle(order.status || 'Pendente')}
                        >
                          {order.status || 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.expected_arrival_date ? 
                          new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>{order.invoice_number || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            Editar
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

        <DataExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />

        <OrderViewDialog
          order={selectedOrder}
          isOpen={isViewDialogOpen}
          onClose={handleCloseViewDialog}
          onOrderUpdate={handleOrderUpdated}
        />

        <OrderFormDialog
          order={selectedOrder}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSuccess={handleOrderUpdated}
        />
      </div>
    </MainLayout>
  );
};

export default Pedidos;
