
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  reportId: string;
  startDate: string;
  endDate: string;
  kpis: string[];
  reportName: string;
}

export const generateReportLocal = async (data: ReportData) => {
  try {
    console.log('Iniciando geração local de relatório...');
    
    // Buscar dados necessários para o relatório
    const [
      equipmentData,
      movementsData,
      ordersData,
      readersData,
      maintenanceData,
      suppliersData
    ] = await Promise.all([
      supabase.from('equipment').select('*'),
      supabase
        .from('inventory_movements')
        .select('*')
        .gte('movement_date', data.startDate)
        .lte('movement_date', data.endDate),
      supabase
        .from('orders')
        .select('*, supplier:suppliers(*), equipment:equipment(*)')
        .gte('created_at', data.startDate)
        .lte('created_at', data.endDate),
      supabase.from('readers').select('*, equipment:equipment(*)'),
      supabase
        .from('maintenance_records')
        .select('*, equipment:equipment(*)')
        .gte('send_date', data.startDate)
        .lte('send_date', data.endDate),
      supabase.from('suppliers').select('*')
    ]);

    if (equipmentData.error || movementsData.error || ordersData.error || readersData.error || maintenanceData.error || suppliersData.error) {
      throw new Error('Erro ao buscar dados para o relatório');
    }

    // Calcular KPIs
    const reportData = calculateKPIs({
      equipment: equipmentData.data || [],
      movements: movementsData.data || [],
      orders: ordersData.data || [],
      readers: readersData.data || [],
      maintenance: maintenanceData.data || [],
      suppliers: suppliersData.data || [],
      startDate: data.startDate,
      endDate: data.endDate,
      selectedKpis: data.kpis
    });

    // Gerar HTML
    const htmlContent = generateHTMLReport(reportData, data.reportName, data.startDate, data.endDate);
    
    // Fazer download direto
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Salvar no histórico
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('report_history').insert({
        user_id: user.id,
        report_name: data.reportName,
        period_start: data.startDate,
        period_end: data.endDate,
        kpis_included: data.kpis,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    console.log('Relatório gerado e baixado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro na geração local do relatório:', error);
    throw error;
  }
};

function calculateKPIs(data: any) {
  const { equipment, movements, orders, readers, maintenance, selectedKpis } = data;
  const kpiResults: any = {};

  if (selectedKpis.includes('stock_summary')) {
    const stockSummary = equipment.reduce((acc: any, item: any) => {
      const itemMovements = movements.filter((m: any) => m.equipment_id === item.id);
      const stock = itemMovements.reduce((stock: number, movement: any) => {
        return movement.movement_type === 'Entrada' 
          ? stock + movement.quantity 
          : stock - movement.quantity;
      }, 0);
      
      acc.totalItems += 1;
      acc.totalStock += stock;
      if (stock < (item.min_stock || 0)) {
        acc.lowStockItems += 1;
      }
      return acc;
    }, { totalItems: 0, totalStock: 0, lowStockItems: 0 });
    
    kpiResults.stock_summary = stockSummary;
  }

  if (selectedKpis.includes('movements_summary')) {
    const movementsSummary = movements.reduce((acc: any, movement: any) => {
      if (movement.movement_type === 'Entrada') {
        acc.totalEntries += movement.quantity;
        acc.entriesCount += 1;
      } else {
        acc.totalExits += movement.quantity;
        acc.exitsCount += 1;
      }
      return acc;
    }, { totalEntries: 0, totalExits: 0, entriesCount: 0, exitsCount: 0 });
    
    kpiResults.movements_summary = movementsSummary;
  }

  if (selectedKpis.includes('orders_summary')) {
    const ordersSummary = orders.reduce((acc: any, order: any) => {
      acc.totalOrders += 1;
      acc.totalQuantity += order.quantity;
      
      if (order.status === 'Recebido') acc.completedOrders += 1;
      else if (order.status === 'Parcialmente Recebido') acc.partialOrders += 1;
      else acc.pendingOrders += 1;
      
      return acc;
    }, { totalOrders: 0, totalQuantity: 0, completedOrders: 0, partialOrders: 0, pendingOrders: 0 });
    
    kpiResults.orders_summary = ordersSummary;
  }

  if (selectedKpis.includes('readers_status')) {
    const readersStatus = readers.reduce((acc: any, reader: any) => {
      acc[reader.status] = (acc[reader.status] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { total: 0 });
    
    kpiResults.readers_status = readersStatus;
  }

  if (selectedKpis.includes('maintenance_summary')) {
    const maintenanceSummary = maintenance.reduce((acc: any, record: any) => {
      acc.totalRecords += 1;
      acc.totalQuantity += record.quantity;
      
      if (record.status === 'Concluída') acc.completed += 1;
      else if (record.status === 'Em Andamento') acc.inProgress += 1;
      else acc.pending += 1;
      
      return acc;
    }, { totalRecords: 0, totalQuantity: 0, completed: 0, inProgress: 0, pending: 0 });
    
    kpiResults.maintenance_summary = maintenanceSummary;
  }

  return kpiResults;
}

function generateHTMLReport(data: any, reportName: string, startDate: string, endDate: string): string {
  const today = new Date();
  const formattedStartDate = new Date(startDate).toLocaleDateString('pt-BR');
  const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');
  const generatedAt = today.toLocaleDateString('pt-BR') + ' às ' + today.toLocaleTimeString('pt-BR');

  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportName}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            color: #1e40af; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
        }
        .section { 
            margin: 30px 0; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .metric { 
            margin: 15px 0; 
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportName}</h1>
        <p><strong>Período:</strong> ${formattedStartDate} - ${formattedEndDate}</p>
        <p><strong>Gerado em:</strong> ${generatedAt}</p>
    </div>`;

  // Adicionar seções baseadas nos KPIs
  if (data.stock_summary) {
    html += `
    <div class="section">
        <h2>📦 ESTOQUE</h2>
        <div class="metric">Total de Itens: ${data.stock_summary.totalItems}</div>
        <div class="metric">Estoque Total: ${data.stock_summary.totalStock} unidades</div>
        <div class="metric">Itens com Estoque Baixo: ${data.stock_summary.lowStockItems}</div>
    </div>`;
  }

  if (data.movements_summary) {
    html += `
    <div class="section">
        <h2>🔄 MOVIMENTAÇÕES</h2>
        <div class="metric">Total de Entradas: ${data.movements_summary.totalEntries}</div>
        <div class="metric">Total de Saídas: ${data.movements_summary.totalExits}</div>
        <div class="metric">Saldo Líquido: ${data.movements_summary.totalEntries - data.movements_summary.totalExits}</div>
    </div>`;
  }

  if (data.orders_summary) {
    html += `
    <div class="section">
        <h2>📋 PEDIDOS</h2>
        <div class="metric">Total de Pedidos: ${data.orders_summary.totalOrders}</div>
        <div class="metric">Quantidade Total: ${data.orders_summary.totalQuantity}</div>
        <div class="metric">Concluídos: ${data.orders_summary.completedOrders} | Parciais: ${data.orders_summary.partialOrders} | Pendentes: ${data.orders_summary.pendingOrders}</div>
    </div>`;
  }

  if (data.readers_status) {
    html += `
    <div class="section">
        <h2>📱 LEITORAS</h2>
        <div class="metric">Total: ${data.readers_status.total}</div>
        <div class="metric">Disponíveis: ${data.readers_status['Disponível'] || 0}</div>
        <div class="metric">Em Uso: ${data.readers_status['Em Uso'] || 0}</div>
        <div class="metric">Em Manutenção: ${data.readers_status['Em Manutenção'] || 0}</div>
    </div>`;
  }

  if (data.maintenance_summary) {
    html += `
    <div class="section">
        <h2>🔧 MANUTENÇÃO</h2>
        <div class="metric">Total de Registros: ${data.maintenance_summary.totalRecords}</div>
        <div class="metric">Quantidade Total: ${data.maintenance_summary.totalQuantity}</div>
        <div class="metric">Concluídas: ${data.maintenance_summary.completed} | Em Andamento: ${data.maintenance_summary.inProgress} | Pendentes: ${data.maintenance_summary.pending}</div>
    </div>`;
  }

  html += `</body></html>`;
  return html;
}
