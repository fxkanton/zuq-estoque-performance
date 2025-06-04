import { useEffect, useState, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, AlertTriangle, Activity, PackageCheck, Calendar } from "lucide-react";
import { getEquipmentWithStock } from "@/services/equipmentService";
import { getMonthlyMovements, getRecentMovements } from "@/services/movementService";
import { getPendingOrders } from "@/services/orderService";
import { getReadersByStatus, EquipmentStatus } from "@/services/readerService";
import { getMaintenceCount } from "@/services/maintenanceService";
import { supabase } from "@/integrations/supabase/client";
import EquipmentInventory from "@/components/EquipmentInventory";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DateRangeFilter from "@/components/ui/date-range-filter";
import { Edit, Trash2 } from 'lucide-react';
import { MovementsDonutChart } from "@/components/dashboard/MovementsDonutChart";
import { TaskReminders } from "@/components/dashboard/TaskReminders";
import { ReportButton } from "@/components/reports/ReportButton";

const Dashboard = () => {
  // Date range state 
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [loading, setLoading] = useState(true);
  
  const [equipmentBalance, setEquipmentBalance] = useState(0);
  const [monthlyMovements, setMonthlyMovements] = useState({ entries: 0, exits: 0, entriesChange: 0, exitsChange: 0, entriesCount: 0, exitsCount: 0 });
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [readerStats, setReaderStats] = useState<Record<EquipmentStatus, number>>({
    'Disponível': 0,
    'Em Uso': 0,
    'Em Manutenção': 0
  });
  const [dailyMovements, setDailyMovements] = useState<any[]>([]);

  // Refs to store channel references for cleanup
  const channelsRef = useRef<any[]>([]);

  const handleDateRangeChange = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  // Function to format date for chart display
  const formatDateForChart = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Function to format date for tooltip
  const formatDateForTooltip = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  // Function to group daily movements based on date range
  const groupMovementsByPeriod = (movements: any[], startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      // Show daily data for periods up to a month with formatted dates
      return movements.map(movement => ({
        ...movement,
        date: formatDateForChart(movement.date),
        originalDate: movement.date
      }));
    } else if (diffDays <= 90) {
      // Group by weeks for periods up to 3 months
      const weeklyData = new Map();
      
      movements.forEach(movement => {
        const date = new Date(movement.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            date: `Semana ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
            originalDate: weekKey,
            entries: 0,
            exits: 0
          });
        }
        
        const week = weeklyData.get(weekKey);
        week.entries += movement.entries;
        week.exits += movement.exits;
      });
      
      return Array.from(weeklyData.values());
    } else {
      // Group by months for longer periods
      const monthlyData = new Map();
      
      movements.forEach(movement => {
        const date = new Date(movement.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            date: `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`,
            originalDate: monthKey,
            entries: 0,
            exits: 0
          });
        }
        
        const month = monthlyData.get(monthKey);
        month.entries += movement.entries;
        month.exits += movement.exits;
      });
      
      return Array.from(monthlyData.values());
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Parallelize all data fetching
      const [
        movementsData,
        entryData,
        exitData,
        orders,
        equipmentWithStock,
        readerStatistics
      ] = await Promise.all([
        supabase
          .from('inventory_movements')
          .select('movement_type, quantity')
          .gte('movement_date', startDateStr)
          .lte('movement_date', endDateStr),
        supabase
          .from('inventory_movements')
          .select('movement_date, quantity')
          .eq('movement_type', 'Entrada')
          .gte('movement_date', startDateStr)
          .lte('movement_date', endDateStr),
        supabase
          .from('inventory_movements')
          .select('movement_date, quantity')
          .eq('movement_type', 'Saída')
          .gte('movement_date', startDateStr)
          .lte('movement_date', endDateStr),
        getPendingOrders(),
        getEquipmentWithStock(),
        getReadersByStatus()
      ]);
        
      if (movementsData.error) {
        console.error("Error fetching movements data:", movementsData.error);
        return;
      }
      
      // Calculate balance and movements
      let balance = 0;
      let entries = 0;
      let exits = 0;
      let entriesCount = 0;
      let exitsCount = 0;
      
      movementsData.data?.forEach(movement => {
        if (movement.movement_type === 'Entrada') {
          balance += movement.quantity;
          entries += movement.quantity;
          entriesCount++;
        } else if (movement.movement_type === 'Saída') {
          balance -= movement.quantity;
          exits += movement.quantity;
          exitsCount++;
        }
      });
      
      setEquipmentBalance(balance);
      setMonthlyMovements({
        entries,
        exits,
        entriesCount,
        exitsCount,
        entriesChange: 0,
        exitsChange: 0
      });
      
      setPendingOrders(orders);
      
      const lowStock = equipmentWithStock.filter(item => 
        (item.min_stock || 0) > 0 && item.stock < (item.min_stock || 0)
      ).slice(0, 4);
      setLowStockItems(lowStock);
      
      setReaderStats(readerStatistics);
      
      if (entryData.error || exitData.error) {
        console.error("Error fetching movement data:", entryData.error || exitData.error);
        return;
      }
      
      // Process daily movement data for the chart
      const daysMap = new Map();
      
      // Initialize with all days in the range
      const dateStart = new Date(startDate);
      const dateEnd = new Date(endDate);
      for (let d = new Date(dateStart); d <= dateEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        daysMap.set(dateStr, { date: dateStr, entries: 0, exits: 0 });
      }
      
      // Add entry data
      entryData.data?.forEach(entry => {
        const dateStr = new Date(entry.movement_date).toISOString().split('T')[0];
        if (daysMap.has(dateStr)) {
          const day = daysMap.get(dateStr);
          day.entries += entry.quantity;
        }
      });
      
      // Add exit data
      exitData.data?.forEach(exit => {
        const dateStr = new Date(exit.movement_date).toISOString().split('T')[0];
        if (daysMap.has(dateStr)) {
          const day = daysMap.get(dateStr);
          day.exits += exit.quantity;
        }
      });
      
      // Convert to array and group by period
      const rawChartData = Array.from(daysMap.values());
      const groupedChartData = groupMovementsByPeriod(rawChartData, startDate, endDate);
      setDailyMovements(groupedChartData);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Create new channels with debounced reload
    let reloadTimeout: NodeJS.Timeout;
    const debouncedReload = () => {
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        loadDashboardData();
      }, 1000);
    };

    // Subscribe to realtime updates
    const equipmentChannel = supabase
      .channel('equipment-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment',
      }, debouncedReload)
      .subscribe();

    const movementsChannel = supabase
      .channel('movements-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_movements',
      }, debouncedReload)
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, debouncedReload)
      .subscribe();

    const readersChannel = supabase
      .channel('readers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'readers',
      }, debouncedReload)
      .subscribe();

    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_records',
      }, debouncedReload)
      .subscribe();

    // Store channels for cleanup
    channelsRef.current = [
      equipmentChannel,
      movementsChannel,
      ordersChannel,
      readersChannel,
      maintenanceChannel
    ];

    return () => {
      clearTimeout(reloadTimeout);
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zuq-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Dashboard</h1>
        <ReportButton />
      </div>
      
      <DateRangeFilter 
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateRangeChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard 
          title="Saldo de Equipamentos" 
          value={equipmentBalance.toString()} 
          trend={{ value: `No período selecionado`, positive: equipmentBalance >= 0 }}
          icon={<PackageCheck className="h-8 w-8 text-zuq-blue" />}
        />
        <StatsCard 
          title="Entradas no Período" 
          value={monthlyMovements.entries.toString()} 
          trend={{ value: `${monthlyMovements.entriesCount} inserções`, positive: monthlyMovements.entriesChange >= 0 }}
          icon={<ArrowDown className="h-8 w-8 text-green-500" />}
        />
        <StatsCard 
          title="Saídas no Período" 
          value={monthlyMovements.exits.toString()} 
          trend={{ value: `${monthlyMovements.exitsCount} inserções`, positive: monthlyMovements.exitsChange < 0 }}
          icon={<ArrowUp className="h-8 w-8 text-amber-500" />}
        />
      </div>

      {/* New section with donut chart and task reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MovementsDonutChart 
          entries={monthlyMovements.entries} 
          exits={monthlyMovements.exits} 
        />
        <TaskReminders />
      </div>

      {/* Equipment inventory component with increased height */}
      <EquipmentInventory startDate={startDate.toISOString().split('T')[0]} endDate={endDate.toISOString().split('T')[0]} />
      
      <div className="grid grid-cols-1 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Movimentações Diárias</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyMovements}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={0}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0 && payload[0]?.payload?.originalDate) {
                      return formatDateForTooltip(payload[0].payload.originalDate);
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="entries" name="Entradas" fill="#4ade80" />
                <Bar dataKey="exits" name="Saídas" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
                      product={order.equipment.brand}
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
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      name={`${item.brand} ${item.model}`} 
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
              {trend.value}
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
