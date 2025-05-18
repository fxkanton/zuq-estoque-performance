
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, AlertTriangle, Activity, PackageCheck } from "lucide-react";
import { getEquipmentWithStock } from "@/services/equipmentService";
import { getMonthlyMovements, getRecentMovements } from "@/services/movementService";
import { getPendingOrders } from "@/services/orderService";
import { getReadersByStatus, EquipmentStatus } from "@/services/readerService";
import { getMaintenceCount } from "@/services/maintenanceService";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [monthlyMovements, setMonthlyMovements] = useState({ entries: 0, exits: 0, entriesChange: 0, exitsChange: 0 });
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [readerStats, setReaderStats] = useState<Record<EquipmentStatus, number>>({
    'Disponível': 0,
    'Em Uso': 0,
    'Em Manutenção': 0
  });

  const loadDashboardData = async () => {
    try {
      // Get equipment with stock count
      const equipmentWithStock = await getEquipmentWithStock();
      setTotalEquipment(equipmentWithStock.length);
      
      // Get monthly movements
      const movements = await getMonthlyMovements();
      setMonthlyMovements(movements);
      
      // Get maintenance count
      const maintenance = await getMaintenceCount();
      setMaintenanceCount(maintenance);
      
      // Get pending orders
      const orders = await getPendingOrders();
      setPendingOrders(orders);
      
      // Get low stock items
      const lowStock = equipmentWithStock.filter(item => 
        (item.min_stock || 0) > 0 && item.stock < (item.min_stock || 0)
      ).slice(0, 4);
      setLowStockItems(lowStock);
      
      // Get reader statistics
      const readerStatistics = await getReadersByStatus();
      setReaderStats(readerStatistics);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Subscribe to realtime updates
    const equipmentChannel = supabase
      .channel('equipment-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment',
      }, () => loadDashboardData())
      .subscribe();

    const movementsChannel = supabase
      .channel('movements-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_movements',
      }, () => loadDashboardData())
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => loadDashboardData())
      .subscribe();

    const readersChannel = supabase
      .channel('readers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'readers',
      }, () => loadDashboardData())
      .subscribe();

    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_records',
      }, () => loadDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(movementsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(readersChannel);
      supabase.removeChannel(maintenanceChannel);
    };
  }, []);

  return (
    <MainLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total de Equipamentos" 
          value={totalEquipment.toString()} 
          trend={{ value: "Cadastrados", positive: true }}
          icon={<PackageCheck className="h-8 w-8 text-zuq-blue" />}
        />
        <StatsCard 
          title="Entradas no Mês" 
          value={monthlyMovements.entries.toString()} 
          trend={{ value: `${monthlyMovements.entriesChange.toFixed(1)}%`, positive: monthlyMovements.entriesChange >= 0 }}
          icon={<ArrowDown className="h-8 w-8 text-green-500" />}
        />
        <StatsCard 
          title="Saídas no Mês" 
          value={monthlyMovements.exits.toString()} 
          trend={{ value: `${monthlyMovements.exitsChange.toFixed(1)}%`, positive: monthlyMovements.exitsChange < 0 }}
          icon={<ArrowUp className="h-8 w-8 text-amber-500" />}
        />
        <StatsCard 
          title="Leitoras em Manutenção" 
          value={readerStats['Em Manutenção'].toString()} 
          trend={{ value: `de ${Object.values(readerStats).reduce((a, b) => a + b, 0)} total`, positive: false }}
          icon={<Activity className="h-8 w-8 text-red-500" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Distribuição de Leitoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Disponíveis</span>
                  <span className="text-sm font-medium text-green-600">{readerStats['Disponível']}</span>
                </div>
                <Progress 
                  value={(readerStats['Disponível'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-2 bg-gray-100" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Em Uso</span>
                  <span className="text-sm font-medium text-blue-600">{readerStats['Em Uso']}</span>
                </div>
                <Progress 
                  value={(readerStats['Em Uso'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-2 bg-gray-100" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Em Manutenção</span>
                  <span className="text-sm font-medium text-red-600">{readerStats['Em Manutenção']}</span>
                </div>
                <Progress 
                  value={(readerStats['Em Manutenção'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-2 bg-gray-100" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Não há movimentações recentes
                </div>
              ) : (
                <>
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{order.equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{order.supplier.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{order.quantity} unidades</p>
                        <p className="text-xs text-muted-foreground">
                          Previsão: {order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Não há pedidos pendentes
                </div>
              ) : (
                <>
                  {pendingOrders.map((order) => (
                    <PendingOrderItem 
                      key={order.id}
                      supplier={order.supplier.name}
                      product={order.equipment.name}
                      quantity={order.quantity}
                      received={order.status === 'Parcialmente Recebido' ? Math.floor(order.quantity * 0.5) : 0}
                      date={order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Alertas de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Não há alertas de estoque
                </div>
              ) : (
                <>
                  {lowStockItems.map((item) => (
                    <AlertItem 
                      key={item.id}
                      name={`${item.name} ${item.model}`} 
                      currentStock={item.stock} 
                      minLevel={item.min_stock || 0} 
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

type StatsCardProps = {
  title: string;
  value: string;
  trend: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
};

const StatsCard = ({ title, value, trend, icon }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-zuq-darkblue">{value}</p>
            <p className={`text-xs mt-2 flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {trend.value} {trend.positive ? 'aumento' : 'redução'}
            </p>
          </div>
          <div className="bg-zuq-gray/30 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type AlertItemProps = {
  name: string;
  currentStock: number;
  minLevel: number;
};

const AlertItem = ({ name, currentStock, minLevel }: AlertItemProps) => {
  const percentage = Math.min(100, (currentStock / minLevel) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">{name}</span>
        </div>
        <span className="text-sm font-medium">{currentStock}/{minLevel}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

type PendingOrderItemProps = {
  supplier: string;
  product: string;
  quantity: number;
  received: number;
  date: string;
};

const PendingOrderItem = ({ supplier, product, quantity, received, date }: PendingOrderItemProps) => {
  const percentage = (received / quantity) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <h4 className="text-sm font-medium">{product}</h4>
          <p className="text-xs text-muted-foreground">{supplier}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{received} de {quantity} recebidos</p>
          <p className="text-xs text-muted-foreground">Previsão: {date}</p>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

export default Dashboard;
