
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

  // Calcular estoque atual para cada equipamento
  const stockData = equipment.map((item: any) => {
    const itemMovements = movements.filter((m: any) => m.equipment_id === item.id);
    const stock = itemMovements.reduce((stock: number, movement: any) => {
      return movement.movement_type === 'Entrada' 
        ? stock + movement.quantity 
        : stock - movement.quantity;
    }, 0);
    
    return {
      ...item,
      currentStock: stock,
      isLowStock: stock < (item.min_stock || 0)
    };
  });

  if (selectedKpis.includes('stock_summary')) {
    const stockSummary = {
      totalItems: stockData.length,
      totalStock: stockData.reduce((sum: number, item: any) => sum + item.currentStock, 0),
      lowStockItems: stockData.filter((item: any) => item.isLowStock).length,
      stockByCategory: stockData.reduce((acc: any, item: any) => {
        const category = item.category || 'Sem Categoria';
        acc[category] = (acc[category] || 0) + item.currentStock;
        return acc;
      }, {}),
      stockDetails: stockData.map((item: any) => ({
        name: `${item.brand} ${item.model}`,
        currentStock: item.currentStock,
        minStock: item.min_stock || 0,
        status: item.isLowStock ? 'Baixo' : 'Normal'
      }))
    };
    kpiResults.stock_summary = stockSummary;
  }

  if (selectedKpis.includes('movements_summary')) {
    const movementsSummary = {
      ...movements.reduce((acc: any, movement: any) => {
        if (movement.movement_type === 'Entrada') {
          acc.totalEntries += movement.quantity;
          acc.entriesCount += 1;
        } else {
          acc.totalExits += movement.quantity;
          acc.exitsCount += 1;
        }
        return acc;
      }, { totalEntries: 0, totalExits: 0, entriesCount: 0, exitsCount: 0 }),
      movementsByDate: movements.reduce((acc: any, movement: any) => {
        const date = new Date(movement.movement_date).toLocaleDateString('pt-BR');
        if (!acc[date]) acc[date] = { entries: 0, exits: 0 };
        if (movement.movement_type === 'Entrada') {
          acc[date].entries += movement.quantity;
        } else {
          acc[date].exits += movement.quantity;
        }
        return acc;
      }, {})
    };
    kpiResults.movements_summary = movementsSummary;
  }

  if (selectedKpis.includes('orders_summary')) {
    const ordersSummary = {
      ...orders.reduce((acc: any, order: any) => {
        acc.totalOrders += 1;
        acc.totalQuantity += order.quantity;
        
        if (order.status === 'Recebido') acc.completedOrders += 1;
        else if (order.status === 'Parcialmente Recebido') acc.partialOrders += 1;
        else acc.pendingOrders += 1;
        
        return acc;
      }, { totalOrders: 0, totalQuantity: 0, completedOrders: 0, partialOrders: 0, pendingOrders: 0 }),
      ordersBySupplier: orders.reduce((acc: any, order: any) => {
        const supplier = order.supplier?.name || 'Fornecedor não informado';
        if (!acc[supplier]) acc[supplier] = { count: 0, quantity: 0 };
        acc[supplier].count += 1;
        acc[supplier].quantity += order.quantity;
        return acc;
      }, {})
    };
    kpiResults.orders_summary = ordersSummary;
  }

  if (selectedKpis.includes('readers_status')) {
    const readersStatus = {
      ...readers.reduce((acc: any, reader: any) => {
        acc[reader.status] = (acc[reader.status] || 0) + 1;
        acc.total += 1;
        return acc;
      }, { total: 0 }),
      readersList: readers.map((reader: any) => ({
        code: reader.code,
        status: reader.status,
        condition: reader.condition,
        equipment: reader.equipment ? `${reader.equipment.brand} ${reader.equipment.model}` : 'N/A'
      }))
    };
    kpiResults.readers_status = readersStatus;
  }

  if (selectedKpis.includes('maintenance_summary')) {
    const maintenanceSummary = {
      ...maintenance.reduce((acc: any, record: any) => {
        acc.totalRecords += 1;
        acc.totalQuantity += record.quantity;
        
        if (record.status === 'Concluída') acc.completed += 1;
        else if (record.status === 'Em Andamento') acc.inProgress += 1;
        else acc.pending += 1;
        
        return acc;
      }, { totalRecords: 0, totalQuantity: 0, completed: 0, inProgress: 0, pending: 0 }),
      maintenanceByMonth: maintenance.reduce((acc: any, record: any) => {
        const month = new Date(record.send_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {})
    };
    kpiResults.maintenance_summary = maintenanceSummary;
  }

  return kpiResults;
}

function generateHTMLReport(data: any, reportName: string, startDate: string, endDate: string): string {
  const today = new Date();
  const formattedStartDate = new Date(startDate).toLocaleDateString('pt-BR');
  const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');
  const generatedAt = today.toLocaleDateString('pt-BR') + ' às ' + today.toLocaleTimeString('pt-BR');

  // ZUQ Logo em base64 como fallback
  const zuqLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWUzYzcyIiByeD0iNSIvPgo8dGV4dCB4PSI2MCIgeT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIj5aVVE8L3RleHQ+Cjwvc3ZnPgo=";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportName}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
            position: relative;
        }
        
        .report-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .report-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="25" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="25" cy="75" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            animation: grain 20s linear infinite;
            pointer-events: none;
        }
        
        @keyframes grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -10%); }
            20% { transform: translate(-15%, 5%); }
            30% { transform: translate(7%, -25%); }
            40% { transform: translate(-5%, 25%); }
            50% { transform: translate(-15%, 10%); }
            60% { transform: translate(15%, 0%); }
            70% { transform: translate(0%, 15%); }
            80% { transform: translate(3%, 35%); }
            90% { transform: translate(-10%, 10%); }
        }
        
        .logo-container {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1;
        }
        
        .logo {
            width: 120px;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .report-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .report-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .report-meta {
            font-size: 1rem;
            opacity: 0.8;
            position: relative;
            z-index: 1;
        }
        
        .export-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10;
        }
        
        .btn-export {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(238, 90, 36, 0.4);
            transition: all 0.3s ease;
            font-size: 14px;
        }
        
        .btn-export:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(238, 90, 36, 0.6);
        }
        
        .report-content {
            padding: 40px;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .main-kpis-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .secondary-kpis-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .kpi-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }
        
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .kpi-card.full-width {
            grid-column: 1 / -1;
        }
        
        .kpi-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1e3c72;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .kpi-icon {
            font-size: 1.8rem;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .metric-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .metric-item:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2a5298;
            margin-bottom: 5px;
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: #6c757d;
            font-weight: 500;
        }
        
        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .chart-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e3c72;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .data-table th {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .data-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .data-table tr:hover {
            background-color: #e3f2fd;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-normal { background: #d4edda; color: #155724; }
        .status-baixo { background: #f8d7da; color: #721c24; }
        .status-disponivel { background: #d1ecf1; color: #0c5460; }
        .status-em-uso { background: #fff3cd; color: #856404; }
        .status-manutencao { background: #f8d7da; color: #721c24; }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; border-radius: 0; }
            .export-controls { display: none !important; }
        }
        
        @media (max-width: 768px) {
            .report-title { font-size: 2rem; }
            .main-kpis-row { grid-template-columns: 1fr; }
            .secondary-kpis-row { grid-template-columns: 1fr; }
            .metric-grid { grid-template-columns: repeat(2, 1fr); }
            .export-controls { position: static; margin-bottom: 20px; }
        }
        
        .movements-chart-block {
            margin-bottom: 40px;
        }
    </style>
</head>
<body>
    <div class="report-container" id="reportContent">
        <div class="export-controls">
            <button class="btn-export" onclick="exportToPDF()">📄 Exportar PDF</button>
        </div>
        
        <div class="report-header">
            <div class="logo-container">
                <img src="${zuqLogoBase64}" alt="ZUQ Logo" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display:none; color:white; font-weight:bold; font-size:18px; background:#1e3c72; padding:10px; border-radius:5px;">ZUQ</div>
            </div>
            <h1 class="report-title">${reportName}</h1>
            <p class="report-subtitle">Relatório Executivo de Gestão</p>
            <div class="report-meta">
                <p><strong>Período:</strong> ${formattedStartDate} - ${formattedEndDate}</p>
                <p><strong>Gerado em:</strong> ${generatedAt}</p>
            </div>
        </div>

        <div class="report-content">
            <!-- KPIs Principais em uma linha -->
            <div class="main-kpis-row">
                ${generateMainKPISections(data)}
            </div>
            
            <!-- KPIs Secundários -->
            <div class="secondary-kpis-row">
                ${generateSecondaryKPISections(data)}
            </div>
            
            <!-- Gráfico de Movimentações em bloco separado -->
            ${data.movements_summary ? `
            <div class="movements-chart-block">
                <div class="kpi-card full-width">
                    <h2 class="kpi-title">
                        <span class="kpi-icon">🔄</span>
                        MOVIMENTAÇÕES POR PERÍODO
                    </h2>
                    <div class="chart-container">
                        <div class="chart-title">Entradas vs Saídas ao Longo do Tempo</div>
                        <canvas id="movementsTimeChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Tabela de Equipamentos em bloco separado -->
            ${generateEquipmentTable(data)}
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} - Relatório gerado automaticamente pelo sistema de gestão ZUQ</p>
            <p>Este documento contém informações confidenciais e estratégicas da organização</p>
        </div>
    </div>

    <script>
        ${generateChartScripts(data)}
        
        async function exportToPDF() {
            const button = document.querySelector('.btn-export');
            const originalText = button.innerHTML;
            button.innerHTML = '⏳ Gerando PDF...';
            button.disabled = true;
            button.style.display = 'none';
            
            try {
                const element = document.getElementById('reportContent');
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save('${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf');
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                alert('Erro ao gerar PDF. Tente novamente.');
            } finally {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.display = 'block';
            }
        }
        
        // Inicializar gráficos quando a página carregar
        window.addEventListener('load', function() {
            initializeCharts();
        });
    </script>
</body>
</html>`;
}

function generateMainKPISections(data: any): string {
  let sections = '';

  // Estoque sempre primeiro
  if (data.stock_summary) {
    const stockData = data.stock_summary;
    sections += `
    <div class="kpi-card">
        <h2 class="kpi-title">
            <span class="kpi-icon">📦</span>
            ESTOQUE
        </h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-value">${stockData.totalItems}</div>
                <div class="metric-label">Total de Itens</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${stockData.totalStock}</div>
                <div class="metric-label">Estoque Total</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${stockData.lowStockItems}</div>
                <div class="metric-label">Estoque Baixo</div>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Distribuição do Estoque por Categoria</div>
            <canvas id="stockChart" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  // Movimentações
  if (data.movements_summary) {
    const movData = data.movements_summary;
    sections += `
    <div class="kpi-card">
        <h2 class="kpi-title">
            <span class="kpi-icon">🔄</span>
            MOVIMENTAÇÕES
        </h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-value">${movData.totalEntries}</div>
                <div class="metric-label">Total Entradas</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${movData.totalExits}</div>
                <div class="metric-label">Total Saídas</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${movData.totalEntries - movData.totalExits}</div>
                <div class="metric-label">Saldo Líquido</div>
            </div>
        </div>
    </div>`;
  }

  // Pedidos
  if (data.orders_summary) {
    const orderData = data.orders_summary;
    sections += `
    <div class="kpi-card">
        <h2 class="kpi-title">
            <span class="kpi-icon">📋</span>
            PEDIDOS
        </h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-value">${orderData.totalOrders}</div>
                <div class="metric-label">Total Pedidos</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${orderData.completedOrders}</div>
                <div class="metric-label">Concluídos</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${orderData.pendingOrders}</div>
                <div class="metric-label">Pendentes</div>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Status dos Pedidos</div>
            <canvas id="ordersChart" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  return sections;
}

function generateSecondaryKPISections(data: any): string {
  let sections = '';

  if (data.readers_status) {
    const readersData = data.readers_status;
    sections += `
    <div class="kpi-card">
        <h2 class="kpi-title">
            <span class="kpi-icon">📱</span>
            LEITORAS
        </h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-value">${readersData.total}</div>
                <div class="metric-label">Total</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${readersData['Disponível'] || 0}</div>
                <div class="metric-label">Disponíveis</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${readersData['Em Uso'] || 0}</div>
                <div class="metric-label">Em Uso</div>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Status das Leitoras</div>
            <canvas id="readersChart" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  if (data.maintenance_summary) {
    const maintenanceData = data.maintenance_summary;
    sections += `
    <div class="kpi-card">
        <h2 class="kpi-title">
            <span class="kpi-icon">🔧</span>
            MANUTENÇÃO
        </h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-value">${maintenanceData.totalRecords}</div>
                <div class="metric-label">Total Registros</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${maintenanceData.completed}</div>
                <div class="metric-label">Concluídas</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${maintenanceData.pending}</div>
                <div class="metric-label">Pendentes</div>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-title">Status da Manutenção</div>
            <canvas id="maintenanceChart" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  return sections;
}

function generateEquipmentTable(data: any): string {
  if (!data.stock_summary || !data.stock_summary.stockDetails || data.stock_summary.stockDetails.length === 0) {
    return '';
  }

  const stockDetails = data.stock_summary.stockDetails;
  return `
  <div class="kpi-card full-width">
      <h2 class="kpi-title">
          <span class="kpi-icon">📋</span>
          DETALHES DO ESTOQUE
      </h2>
      <table class="data-table">
          <thead>
              <tr>
                  <th>Equipamento</th>
                  <th>Estoque Atual</th>
                  <th>Estoque Mínimo</th>
                  <th>Status</th>
              </tr>
          </thead>
          <tbody>
              ${stockDetails.map((item: any) => `
              <tr>
                  <td>${item.name}</td>
                  <td>${item.currentStock}</td>
                  <td>${item.minStock}</td>
                  <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
              </tr>
              `).join('')}
          </tbody>
      </table>
  </div>`;
}

function generateChartScripts(data: any): string {
  let scripts = `
    function initializeCharts() {
      Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      Chart.defaults.font.size = 12;
      Chart.defaults.plugins.legend.position = 'bottom';
  `;

  if (data.stock_summary && data.stock_summary.stockByCategory) {
    const categories = Object.keys(data.stock_summary.stockByCategory);
    const values = Object.values(data.stock_summary.stockByCategory);
    scripts += `
      const stockCtx = document.getElementById('stockChart');
      if (stockCtx) {
        new Chart(stockCtx, {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify(categories)},
            datasets: [{
              data: ${JSON.stringify(values)},
              backgroundColor: [
                '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    `;
  }

  if (data.movements_summary && data.movements_summary.movementsByDate) {
    const dates = Object.keys(data.movements_summary.movementsByDate);
    const entries = dates.map(date => data.movements_summary.movementsByDate[date].entries);
    const exits = dates.map(date => data.movements_summary.movementsByDate[date].exits);
    scripts += `
      const movTimeCtx = document.getElementById('movementsTimeChart');
      if (movTimeCtx) {
        new Chart(movTimeCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(dates)},
            datasets: [{
              label: 'Entradas',
              data: ${JSON.stringify(entries)},
              borderColor: '#4facfe',
              backgroundColor: 'rgba(79, 172, 254, 0.1)',
              tension: 0.4,
              fill: true
            }, {
              label: 'Saídas',
              data: ${JSON.stringify(exits)},
              borderColor: '#f5576c',
              backgroundColor: 'rgba(245, 87, 108, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            scales: {
              y: { 
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              }
            },
            plugins: {
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: 'white',
                bodyColor: 'white'
              }
            }
          }
        });
      }
    `;
  }

  if (data.orders_summary) {
    const orderData = data.orders_summary;
    scripts += `
      const ordersCtx = document.getElementById('ordersChart');
      if (ordersCtx) {
        new Chart(ordersCtx, {
          type: 'pie',
          data: {
            labels: ['Concluídos', 'Parciais', 'Pendentes'],
            datasets: [{
              data: [${orderData.completedOrders}, ${orderData.partialOrders}, ${orderData.pendingOrders}],
              backgroundColor: ['#4facfe', '#f093fb', '#f5576c'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    `;
  }

  if (data.readers_status) {
    const readersData = data.readers_status;
    const statuses = ['Disponível', 'Em Uso', 'Em Manutenção'];
    const statusCounts = statuses.map(status => readersData[status] || 0);
    scripts += `
      const readersCtx = document.getElementById('readersChart');
      if (readersCtx) {
        new Chart(readersCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(statuses)},
            datasets: [{
              data: ${JSON.stringify(statusCounts)},
              backgroundColor: ['#4facfe', '#f093fb', '#f5576c'],
              borderWidth: 0,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { 
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    `;
  }

  if (data.maintenance_summary) {
    const maintenanceData = data.maintenance_summary;
    scripts += `
      const maintenanceCtx = document.getElementById('maintenanceChart');
      if (maintenanceCtx) {
        new Chart(maintenanceCtx, {
          type: 'doughnut',
          data: {
            labels: ['Concluídas', 'Em Andamento', 'Pendentes'],
            datasets: [{
              data: [${maintenanceData.completed}, ${maintenanceData.inProgress}, ${maintenanceData.pending}],
              backgroundColor: ['#4facfe', '#f093fb', '#f5576c'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    `;
  }

  scripts += `
    }
  `;

  return scripts;
}
