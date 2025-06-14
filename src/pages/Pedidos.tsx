
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  fetchOrders, 
  createOrder, 
  OrderWithDetails,
  OrderStatus 
} from "@/services/orderService";
import { fetchEquipment } from "@/services/equipmentService";
import { fetchSuppliers } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    equipment_id: '',
    supplier_id: '',
    quantity: 1,
    expected_arrival_date: '',
    notes: ''
  });

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

    return () => {
      supabase.removeChannel(ordersChannel);
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
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedOrder(order)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{getEquipmentLabel(order)}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Quantidade: <span className="font-semibold text-zuq-blue ml-1">{order.quantity}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalhes do Pedido</h2>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Fechar
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Equipamento</p>
                    <p className="font-medium">{getEquipmentLabel(selectedOrder)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{selectedOrder.supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Pedido</p>
                    <p className="font-medium">
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                    <p className="font-medium">
                      {selectedOrder.expected_arrival_date ? new Date(selectedOrder.expected_arrival_date).toLocaleDateString('pt-BR') : 'Não definida'}
                    </p>
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Pedidos;
