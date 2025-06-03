
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
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Gerar PDF simples usando HTML
    console.log('Gerando PDF...');
    const htmlContent = generateHTMLReport(reportData, reportName, startDate, endDate);
    
    // Converter HTML para PDF usando uma abordagem mais simples
    const pdfBuffer = new TextEncoder().encode(htmlContent);

    console.log('PDF gerado, tamanho:', pdfBuffer.length);

    // Fazer upload do PDF para o Storage
    const fileName = `${reportId}/${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    console.log('Fazendo upload do arquivo:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'text/html'
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw uploadError;
    }

    console.log('Upload realizado com sucesso:', uploadData);

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseClient.storage
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
        status: 400,
      }
    );
  }
});

function calculateKPIs(data: any) {
  console.log('Iniciando cálculo de KPIs...');
  const { equipment, movements, orders, readers, maintenance, selectedKpis } = data;
  
  const kpiResults: any = {};

  try {
    // Calcular estoque total
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

    // Calcular movimentações
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

    // Calcular pedidos
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

    // Calcular status das leitoras
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

    // Calcular manutenções
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

  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { color: #1e40af; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .section h2 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
            .metric { margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${reportName}</h1>
            <p>Período: ${formattedStartDate} - ${formattedEndDate}</p>
            <p>Gerado em: ${generatedAt}</p>
        </div>
        
        <div class="section">
            <h2>RESUMO EXECUTIVO</h2>
        </div>
  `;

  // Adicionar seções baseadas nos KPIs
  if (data.stock_summary) {
    html += `
        <div class="section">
            <h2>ESTOQUE</h2>
            <div class="metric">Total de Itens: ${data.stock_summary.totalItems}</div>
            <div class="metric">Estoque Total: ${data.stock_summary.totalStock} unidades</div>
            <div class="metric">Itens com Estoque Baixo: ${data.stock_summary.lowStockItems}</div>
        </div>
    `;
  }

  if (data.movements_summary) {
    html += `
        <div class="section">
            <h2>MOVIMENTAÇÕES</h2>
            <div class="metric">Total de Entradas: ${data.movements_summary.totalEntries} (${data.movements_summary.entriesCount} movimentações)</div>
            <div class="metric">Total de Saídas: ${data.movements_summary.totalExits} (${data.movements_summary.exitsCount} movimentações)</div>
            <div class="metric">Saldo Líquido: ${data.movements_summary.totalEntries - data.movements_summary.totalExits}</div>
        </div>
    `;
  }

  if (data.orders_summary) {
    html += `
        <div class="section">
            <h2>PEDIDOS</h2>
            <div class="metric">Total de Pedidos: ${data.orders_summary.totalOrders}</div>
            <div class="metric">Quantidade Total: ${data.orders_summary.totalQuantity} unidades</div>
            <div class="metric">Concluídos: ${data.orders_summary.completedOrders} | Parciais: ${data.orders_summary.partialOrders} | Pendentes: ${data.orders_summary.pendingOrders}</div>
        </div>
    `;
  }

  if (data.readers_status) {
    html += `
        <div class="section">
            <h2>LEITORAS</h2>
            <div class="metric">Total de Leitoras: ${data.readers_status.total}</div>
            <div class="metric">Disponíveis: ${data.readers_status['Disponível'] || 0}</div>
            <div class="metric">Em Uso: ${data.readers_status['Em Uso'] || 0}</div>
            <div class="metric">Em Manutenção: ${data.readers_status['Em Manutenção'] || 0}</div>
        </div>
    `;
  }

  if (data.maintenance_summary) {
    html += `
        <div class="section">
            <h2>MANUTENÇÃO</h2>
            <div class="metric">Total de Registros: ${data.maintenance_summary.totalRecords}</div>
            <div class="metric">Quantidade Total: ${data.maintenance_summary.totalQuantity} unidades</div>
            <div class="metric">Concluídas: ${data.maintenance_summary.completed} | Em Andamento: ${data.maintenance_summary.inProgress} | Pendentes: ${data.maintenance_summary.pending}</div>
        </div>
    `;
  }

  html += `
        <div class="section">
            <p><small>Sistema de Inventário ZUQ</small></p>
        </div>
    </body>
    </html>
  `;

  console.log('HTML gerado com sucesso');
  return html;
}
