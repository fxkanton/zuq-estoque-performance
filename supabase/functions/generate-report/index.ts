
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  reportId: string;
  startDate: string;
  endDate: string;
  kpis: string[];
  reportName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando geração de relatório...');
    
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('User authenticated:', user.email);

    const { reportId, startDate, endDate, kpis, reportName }: ReportData = await req.json();
    console.log('Dados recebidos:', { reportId, startDate, endDate, kpis, reportName });

    // Buscar dados necessários para o relatório
    console.log('Buscando dados do banco...');
    const [
      equipmentData,
      movementsData,
      ordersData,
      readersData,
      maintenanceData,
      suppliersData
    ] = await Promise.all([
      supabaseClient.from('equipment').select('*'),
      supabaseClient
        .from('inventory_movements')
        .select('*')
        .gte('movement_date', startDate)
        .lte('movement_date', endDate),
      supabaseClient
        .from('orders')
        .select('*, supplier:suppliers(*), equipment:equipment(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabaseClient.from('readers').select('*, equipment:equipment(*)'),
      supabaseClient
        .from('maintenance_records')
        .select('*, equipment:equipment(*)')
        .gte('send_date', startDate)
        .lte('send_date', endDate),
      supabaseClient.from('suppliers').select('*')
    ]);

    console.log('Dados obtidos:', {
      equipment: equipmentData.data?.length || 0,
      movements: movementsData.data?.length || 0,
      orders: ordersData.data?.length || 0,
      readers: readersData.data?.length || 0,
      maintenance: maintenanceData.data?.length || 0,
      suppliers: suppliersData.data?.length || 0
    });

    if (equipmentData.error || movementsData.error || ordersData.error || readersData.error || maintenanceData.error || suppliersData.error) {
      console.error('Error fetching data:', {
        equipment: equipmentData.error,
        movements: movementsData.error,
        orders: ordersData.error,
        readers: readersData.error,
        maintenance: maintenanceData.error,
        suppliers: suppliersData.error
      });
      throw new Error('Failed to fetch required data');
    }

    // Calcular KPIs
    console.log('Calculando KPIs...');
    const reportData = calculateKPIs({
      equipment: equipmentData.data || [],
      movements: movementsData.data || [],
      orders: ordersData.data || [],
      readers: readersData.data || [],
      maintenance: maintenanceData.data || [],
      suppliers: suppliersData.data || [],
      startDate,
      endDate,
      selectedKpis: kpis
    });

    console.log('KPIs calculados:', reportData);

    // Gerar HTML para o relatório
    console.log('Gerando HTML...');
    const htmlContent = generateHTMLReport(reportData, reportName, startDate, endDate);
    
    const fileBuffer = new TextEncoder().encode(htmlContent);
    console.log('HTML gerado, tamanho:', fileBuffer.length);

    // Use service role client for storage operations
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const fileName = `${reportId}/${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    console.log('Fazendo upload do arquivo:', fileName);
    
    const { data: uploadData, error: uploadError } = await serviceRoleClient.storage
      .from('reports')
      .upload(fileName, fileBuffer, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload realizado com sucesso:', uploadData);

    const { data: urlData } = serviceRoleClient.storage
      .from('reports')
      .getPublicUrl(fileName);

    console.log('URL pública gerada:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        fileUrl: urlData.publicUrl,
        fileName: fileName 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function calculateKPIs(data: any) {
  console.log('Iniciando cálculo de KPIs...');
  const { equipment, movements, orders, readers, maintenance, selectedKpis } = data;
  
  const kpiResults: any = {};

  try {
    if (selectedKpis.includes('stock_summary')) {
      console.log('Calculando stock_summary...');
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
      console.log('Stock summary:', stockSummary);
    }

    if (selectedKpis.includes('movements_summary')) {
      console.log('Calculando movements_summary...');
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
      console.log('Movements summary:', movementsSummary);
    }

    if (selectedKpis.includes('orders_summary')) {
      console.log('Calculando orders_summary...');
      const ordersSummary = orders.reduce((acc: any, order: any) => {
        acc.totalOrders += 1;
        acc.totalQuantity += order.quantity;
        
        if (order.status === 'Recebido') acc.completedOrders += 1;
        else if (order.status === 'Parcialmente Recebido') acc.partialOrders += 1;
        else acc.pendingOrders += 1;
        
        return acc;
      }, { totalOrders: 0, totalQuantity: 0, completedOrders: 0, partialOrders: 0, pendingOrders: 0 });
      
      kpiResults.orders_summary = ordersSummary;
      console.log('Orders summary:', ordersSummary);
    }

    if (selectedKpis.includes('readers_status')) {
      console.log('Calculando readers_status...');
      const readersStatus = readers.reduce((acc: any, reader: any) => {
        acc[reader.status] = (acc[reader.status] || 0) + 1;
        acc.total += 1;
        return acc;
      }, { total: 0 });
      
      kpiResults.readers_status = readersStatus;
      console.log('Readers status:', readersStatus);
    }

    if (selectedKpis.includes('maintenance_summary')) {
      console.log('Calculando maintenance_summary...');
      const maintenanceSummary = maintenance.reduce((acc: any, record: any) => {
        acc.totalRecords += 1;
        acc.totalQuantity += record.quantity;
        
        if (record.status === 'Concluída') acc.completed += 1;
        else if (record.status === 'Em Andamento') acc.inProgress += 1;
        else acc.pending += 1;
        
        return acc;
      }, { totalRecords: 0, totalQuantity: 0, completed: 0, inProgress: 0, pending: 0 });
      
      kpiResults.maintenance_summary = maintenanceSummary;
      console.log('Maintenance summary:', maintenanceSummary);
    }

    console.log('KPIs calculados com sucesso:', kpiResults);
    return kpiResults;
  } catch (error) {
    console.error('Erro no cálculo de KPIs:', error);
    throw error;
  }
}

function generateHTMLReport(data: any, reportName: string, startDate: string, endDate: string): string {
  console.log('Gerando HTML do relatório...');
  
  const today = new Date();
  const formattedStartDate = new Date(startDate).toLocaleDateString('pt-BR');
  const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');
  const generatedAt = today.toLocaleDateString('pt-BR') + ' às ' + today.toLocaleTimeString('pt-BR');

  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'; script-src 'none';">
    <title>${reportName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }
        .header { 
            color: #1e40af; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: normal;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section { 
            margin: 30px 0; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .section h2 { 
            color: #1e40af; 
            border-bottom: 2px solid #1e40af; 
            padding-bottom: 10px;
            margin-top: 0;
            font-size: 1.5em;
        }
        .metric { 
            margin: 15px 0; 
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #1e40af;
        }
        .metric-label {
            font-weight: bold;
            color: #555;
        }
        .metric-value {
            font-size: 1.2em;
            color: #1e40af;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportName}</h1>
        <p><strong>Período:</strong> ${formattedStartDate} - ${formattedEndDate}</p>
        <p><strong>Gerado em:</strong> ${generatedAt}</p>
    </div>
    
    <div class="section">
        <h2>📊 RESUMO EXECUTIVO</h2>
        <p>Este relatório apresenta os principais indicadores de desempenho do sistema de inventário ZUQ para o período selecionado.</p>
    </div>`;

  // Adicionar seções baseadas nos KPIs
  if (data.stock_summary) {
    html += `
    <div class="section">
        <h2>📦 ESTOQUE</h2>
        <div class="metric">
            <span class="metric-label">Total de Itens:</span>
            <span class="metric-value">${data.stock_summary.totalItems}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Estoque Total:</span>
            <span class="metric-value">${data.stock_summary.totalStock} unidades</span>
        </div>
        <div class="metric">
            <span class="metric-label">Itens com Estoque Baixo:</span>
            <span class="metric-value">${data.stock_summary.lowStockItems}</span>
        </div>
    </div>`;
  }

  if (data.movements_summary) {
    html += `
    <div class="section">
        <h2>🔄 MOVIMENTAÇÕES</h2>
        <div class="metric">
            <span class="metric-label">Total de Entradas:</span>
            <span class="metric-value">${data.movements_summary.totalEntries} (${data.movements_summary.entriesCount} movimentações)</span>
        </div>
        <div class="metric">
            <span class="metric-label">Total de Saídas:</span>
            <span class="metric-value">${data.movements_summary.totalExits} (${data.movements_summary.exitsCount} movimentações)</span>
        </div>
        <div class="metric">
            <span class="metric-label">Saldo Líquido:</span>
            <span class="metric-value">${data.movements_summary.totalEntries - data.movements_summary.totalExits}</span>
        </div>
    </div>`;
  }

  if (data.orders_summary) {
    html += `
    <div class="section">
        <h2>📋 PEDIDOS</h2>
        <div class="metric">
            <span class="metric-label">Total de Pedidos:</span>
            <span class="metric-value">${data.orders_summary.totalOrders}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Quantidade Total:</span>
            <span class="metric-value">${data.orders_summary.totalQuantity} unidades</span>
        </div>
        <div class="metric">
            <span class="metric-label">Status dos Pedidos:</span>
            <span class="metric-value">Concluídos: ${data.orders_summary.completedOrders} | Parciais: ${data.orders_summary.partialOrders} | Pendentes: ${data.orders_summary.pendingOrders}</span>
        </div>
    </div>`;
  }

  if (data.readers_status) {
    html += `
    <div class="section">
        <h2>📱 LEITORAS</h2>
        <div class="metric">
            <span class="metric-label">Total de Leitoras:</span>
            <span class="metric-value">${data.readers_status.total}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Disponíveis:</span>
            <span class="metric-value">${data.readers_status['Disponível'] || 0}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Em Uso:</span>
            <span class="metric-value">${data.readers_status['Em Uso'] || 0}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Em Manutenção:</span>
            <span class="metric-value">${data.readers_status['Em Manutenção'] || 0}</span>
        </div>
    </div>`;
  }

  if (data.maintenance_summary) {
    html += `
    <div class="section">
        <h2>🔧 MANUTENÇÃO</h2>
        <div class="metric">
            <span class="metric-label">Total de Registros:</span>
            <span class="metric-value">${data.maintenance_summary.totalRecords}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Quantidade Total:</span>
            <span class="metric-value">${data.maintenance_summary.totalQuantity} unidades</span>
        </div>
        <div class="metric">
            <span class="metric-label">Status das Manutenções:</span>
            <span class="metric-value">Concluídas: ${data.maintenance_summary.completed} | Em Andamento: ${data.maintenance_summary.inProgress} | Pendentes: ${data.maintenance_summary.pending}</span>
        </div>
    </div>`;
  }

  html += `
    <div class="footer">
        <p><strong>Sistema de Inventário ZUQ</strong></p>
        <p>Relatório gerado automaticamente pelo sistema</p>
    </div>
</body>
</html>`;

  console.log('HTML gerado com sucesso');
  return html;
}
