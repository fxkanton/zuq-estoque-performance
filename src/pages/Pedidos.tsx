import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OrderBatchForm from "@/components/OrderBatchForm";
import OrderBatchDetails from "@/components/OrderBatchDetails";

// Mock data for orders
const mockOrders = [
  {
    id: "1",
    batchNumber: "LOTE-001",
    supplier: "TechnoRFID Ltda",
    status: "Pendente" as const,
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
    status: "Em Trânsito" as const,
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
    status: "Entregue" as const,
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);

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
              onClick={() => setIsFormOpen(true)}
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

        {isFormOpen && (
          <OrderBatchForm 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {selectedOrder && (
          <OrderBatchDetails
            order={selectedOrder}
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Pedidos;
