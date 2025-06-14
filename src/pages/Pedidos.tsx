
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Simple order interface for mock data
interface MockOrder {
  id: string;
  batchNumber: string;
  supplier: string;
  status: "Pendente" | "Em Trânsito" | "Entregue";
  orderDate: string;
  expectedDelivery: string;
  items: Array<{
    equipment: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalValue: number;
  notes: string;
}

// Mock data for orders
const mockOrders: MockOrder[] = [
  {
    id: "1",
    batchNumber: "LOTE-001",
    supplier: "TechnoRFID Ltda",
    status: "Pendente",
    orderDate: "2024-12-15",
    expectedDelivery: "2024-12-30",
    items: [
      { equipment: "Leitora RFID UHF 900MHz", quantity: 5, unitPrice: 450.00 },
      { equipment: "Antena Linear 8dBi", quantity: 10, unitPrice: 85.00 }
    ],
    totalValue: 3100.00,
    notes: "Pedido urgente para projeto cliente ABC"
  },
  {
    id: "2", 
    batchNumber: "LOTE-002",
    supplier: "ElectroComponents S.A.",
    status: "Em Trânsito",
    orderDate: "2024-12-10",
    expectedDelivery: "2024-12-25",
    items: [
      { equipment: "Sensor de Proximidade", quantity: 20, unitPrice: 25.00 },
      { equipment: "Cabo USB-C 2m", quantity: 15, unitPrice: 12.00 }
    ],
    totalValue: 680.00,
    notes: ""
  },
  {
    id: "3",
    batchNumber: "LOTE-003", 
    supplier: "Global Tech Solutions",
    status: "Entregue",
    orderDate: "2024-12-05",
    expectedDelivery: "2024-12-20",
    items: [
      { equipment: "Rastreador GPS", quantity: 8, unitPrice: 120.00 },
      { equipment: "Bateria Li-ion 3000mAh", quantity: 16, unitPrice: 35.00 }
    ],
    totalValue: 1520.00,
    notes: "Entregue em perfeitas condições"
  }
];

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pendente":
        return <Package className="h-4 w-4" />;
      case "Em Trânsito":
        return <Truck className="h-4 w-4" />;
      case "Entregue":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "Pendente": "bg-yellow-100 text-yellow-800",
      "Em Trânsito": "bg-blue-100 text-blue-800", 
      "Entregue": "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const filteredOrders = activeTab === "todos" 
    ? mockOrders 
    : mockOrders.filter(order => order.status.toLowerCase().replace(" ", "-") === activeTab);

  return (
    <MainLayout title="Pedidos de Equipamentos">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Controle de Pedidos</h1>
          
          <div className="flex justify-start">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/90 text-white flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Novo Lote de Pedido
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
            {filteredOrders.length === 0 ? (
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
                        <CardTitle className="text-lg">{order.batchNumber}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Fornecedor</p>
                          <p className="font-medium">{order.supplier}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data do Pedido</p>
                          <p className="font-medium">{new Date(order.orderDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                          <p className="font-medium">{new Date(order.expectedDelivery).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item(s) - Total: 
                            <span className="font-semibold text-zuq-blue ml-1">
                              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
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

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalhes do Pedido - {selectedOrder.batchNumber}</h2>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Fechar
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{selectedOrder.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Pedido</p>
                    <p className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                    <p className="font-medium">{new Date(selectedOrder.expectedDelivery).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{item.equipment}</span>
                        <div className="text-right">
                          <p className="text-sm">Qtd: {item.quantity}</p>
                          <p className="text-sm font-medium">R$ {item.unitPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total do Pedido:</span>
                    <span className="font-bold text-lg text-zuq-blue">
                      R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
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
