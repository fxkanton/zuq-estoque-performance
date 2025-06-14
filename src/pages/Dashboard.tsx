import { useEffect, useState, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, AlertTriangle, Activity, PackageCheck, Calendar, TrendingUp, TrendingDown, Users, Package, Clock, BarChart3 } from "lucide-react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Dashboard = () => {
  // Date range state 
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [loadingState, setLoadingState] = useState<'initial' | 'loading' | 'idle'>('initial');
  
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
  const [xAxisInterval, setXAxisInterval] = useState<number | 'preserveStartEnd'>(0);

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
    setLoadingState(s => (s === 'initial' ? 'initial' : 'loading'));
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Set interval for chart's X-axis based on date range duration
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to approx number of days
      
      if (diffDays > 15) {
        setXAxisInterval(Math.floor(diffDays / 7)); // Aim for ~7 ticks
      } else {
        setXAxisInterval(0); // Show all ticks for shorter ranges
      }

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
      setLoadingState('idle');
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

  if (loadingState === 'initial') {
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
      {/* Mobile: Stack title and button vertically */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-zuq-darkblue bg-gradient-to-r from-zuq-darkblue to-zuq-blue bg-clip-text text-transparent">
          Dashboard
        </h1>
        {/* Button below title on mobile */}
        <div className="md:self-start">
          <ReportButton />
        </div>
      </div>
      
      {/* Adjust date filter container for mobile */}
      <div className="mb-6">
        <DateRangeFilter 
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />
      </div>
      
      {/* New layout: Left side with stacked cards, right side with task reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left column - Reorganized cards */}
        <div className="space-y-6 relative">
          {loadingState === 'loading' && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg transition-opacity duration-300">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zuq-blue"></div>
            </div>
          )}
          
          {/* Equipment Balance */}
          <StatsCard 
            title="Saldo de Equipamentos" 
            value={equipmentBalance.toString()} 
            trend={{ value: `No período selecionado`, positive: equipmentBalance >= 0 }}
            icon={<PackageCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />}
            gradientFrom="from-blue-50"
            gradientTo="to-indigo-50"
            borderColor="border-blue-100"
            iconBg="bg-blue-100"
          />
          
          {/* Movements Chart - responsive sizing */}
          <div className="h-[400px] md:h-[600px]">
            <MovementsDonutChart 
              entries={monthlyMovements.entries} 
              exits={monthlyMovements.exits} 
            />
          </div>
        </div>
        
        {/* Right column - Task Reminders */}
        <div className="h-full">
          <TaskReminders />
        </div>
      </div>

      {/* Equipment inventory component */}
      <EquipmentInventory startDate={startDate.toISOString().split('T')[0]} endDate={endDate.toISOString().split('T')[0]} />
      
      {/* Daily movements chart with horizontal scroll on mobile */}
      <div className="grid grid-cols-1 mb-8">
        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 relative">
          {loadingState === 'loading' && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg transition-opacity duration-300">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zuq-blue"></div>
            </div>
          )}
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
            <CardTitle className="text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              Movimentações Diárias
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 p-6">
            {/* Add horizontal scroll for mobile */}
            <div className="md:hidden">
              <ScrollArea className="w-full h-full">
                <div className="min-w-[600px] h-full">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        interval={xAxisInterval}
                        angle={0}
                      />
                      <YAxis tick={{ fill: '#64748b' }} />
                      <Tooltip 
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0 && payload[0]?.payload?.originalDate) {
                            return formatDateForTooltip(payload[0].payload.originalDate);
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="entries" name="Entradas" fill="#4ade80" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="exits" name="Saídas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            {/* Desktop version without scroll */}
            <div className="hidden md:block h-full">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    interval={xAxisInterval}
                    angle={0}
                  />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && payload[0]?.payload?.originalDate) {
                        return formatDateForTooltip(payload[0].payload.originalDate);
                      }
                      return label;
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="entries" name="Entradas" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exits" name="Saídas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-white to-cyan-50/30 border-cyan-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-cyan-100">
            <CardTitle className="text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-full">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              Distribuição de Leitoras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Disponíveis</span>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {readerStats['Disponível']}
                  </span>
                </div>
                <Progress 
                  value={(readerStats['Disponível'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-3 bg-gray-100 shadow-inner" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Em Uso</span>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {readerStats['Em Uso']}
                  </span>
                </div>
                <Progress 
                  value={(readerStats['Em Uso'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-3 bg-gray-100 shadow-inner" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Em Manutenção</span>
                  <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    {readerStats['Em Manutenção']}
                  </span>
                </div>
                <Progress 
                  value={(readerStats['Em Manutenção'] / Math.max(1, Object.values(readerStats).reduce((a, b) => a + b, 0))) * 100} 
                  className="h-3 bg-gray-100 shadow-inner" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-yellow-50/30 border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
            <CardTitle className="text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Não há pedidos pendentes</p>
                  <p className="text-xs text-gray-400 mt-1">Tudo em dia! 📦</p>
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
        <Card className="bg-gradient-to-br from-white to-red-50/30 border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
            <CardTitle className="text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Não há alertas de estoque</p>
                  <p className="text-xs text-gray-400 mt-1">Tudo sob controle! ✅</p>
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
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  iconBg?: string;
};

const StatsCard = ({ title, value, trend, icon, gradientFrom = "from-white", gradientTo = "to-gray-50/30", borderColor = "border-gray-100", iconBg = "bg-gray-100" }: StatsCardProps) => {
  return (
    <Card className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <CardContent className="p-3 md:p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-gray-600 font-medium mb-1 md:mb-2 line-clamp-2">{title}</p>
            <p className="text-xl md:text-3xl font-bold text-zuq-darkblue mb-2 md:mb-3">{value}</p>
            <div className={`flex items-center gap-1 md:gap-2 text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full ${trend.positive ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
              {trend.positive ? <TrendingUp className="h-2 w-2 md:h-3 md:w-3 flex-shrink-0" /> : <TrendingDown className="h-2 w-2 md:h-3 md:w-3 flex-shrink-0" />}
              <span className="font-medium text-xs truncate">{trend.value}</span>
            </div>
          </div>
          <div className={`${iconBg} p-2 md:p-3 rounded-full shadow-sm flex-shrink-0 ml-2`}>
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
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="space-y-3">
        <div className="flex justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{name}</h4>
            <p className="text-xs text-gray-600 font-medium">Estoque atual: {currentStock}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-red-700">
              {currentStock}/{minLevel}
            </p>
          </div>
        </div>
        <Progress value={percentage} className="h-2 bg-red-100" />
      </div>
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
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="space-y-3">
        <div className="flex justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{product}</h4>
            <p className="text-xs text-gray-600 font-medium">{supplier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-yellow-700">
              {received} de {quantity} recebidos
            </p>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Previsão: {date}
            </p>
          </div>
        </div>
        <Progress value={percentage} className="h-2 bg-yellow-100" />
      </div>
    </div>
  );
};

export default Dashboard;
