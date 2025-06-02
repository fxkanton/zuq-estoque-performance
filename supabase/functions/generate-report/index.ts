
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reportId, startDate, endDate, kpis, reportName }: ReportData = await req.json();

    // Buscar dados necessários para o relatório
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

    // Calcular KPIs
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

    // Gerar PDF
    const pdfBuffer = await generatePDF(reportData, reportName, startDate, endDate);

    // Fazer upload do PDF para o Storage
    const fileName = `${reportId}/${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseClient.storage
      .from('reports')
      .getPublicUrl(fileName);

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
  const { equipment, movements, orders, readers, maintenance, selectedKpis } = data;
  
  const kpiResults: any = {};

  // Calcular estoque total
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

  // Calcular movimentações
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

  // Calcular pedidos
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

  // Calcular status das leitoras
  if (selectedKpis.includes('readers_status')) {
    const readersStatus = readers.reduce((acc: any, reader: any) => {
      acc[reader.status] = (acc[reader.status] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { total: 0 });
    
    kpiResults.readers_status = readersStatus;
  }

  // Calcular manutenções
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

async function generatePDF(data: any, reportName: string, startDate: string, endDate: string): Promise<Uint8Array> {
  const doc = new jsPDF();
  
  // Configurações de estilo
  const primaryColor = '#1e40af';
  const secondaryColor = '#64748b';
  const fontSize = {
    title: 20,
    subtitle: 16,
    normal: 12,
    small: 10
  };

  let yPosition = 20;

  // Cabeçalho
  doc.setFontSize(fontSize.title);
  doc.setTextColor(primaryColor);
  doc.text(reportName, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(fontSize.normal);
  doc.setTextColor(secondaryColor);
  doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`, 20, yPosition);
  yPosition += 10;

  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition);
  yPosition += 20;

  // Resumo Executivo
  doc.setFontSize(fontSize.subtitle);
  doc.setTextColor(primaryColor);
  doc.text('RESUMO EXECUTIVO', 20, yPosition);
  yPosition += 15;

  // Adicionar seções baseadas nos KPIs selecionados
  if (data.stock_summary) {
    doc.setFontSize(fontSize.subtitle);
    doc.setTextColor(primaryColor);
    doc.text('ESTOQUE', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(fontSize.normal);
    doc.setTextColor('black');
    doc.text(`Total de Itens: ${data.stock_summary.totalItems}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Estoque Total: ${data.stock_summary.totalStock} unidades`, 20, yPosition);
    yPosition += 6;
    doc.text(`Itens com Estoque Baixo: ${data.stock_summary.lowStockItems}`, 20, yPosition);
    yPosition += 15;
  }

  if (data.movements_summary) {
    doc.setFontSize(fontSize.subtitle);
    doc.setTextColor(primaryColor);
    doc.text('MOVIMENTAÇÕES', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(fontSize.normal);
    doc.setTextColor('black');
    doc.text(`Total de Entradas: ${data.movements_summary.totalEntries} (${data.movements_summary.entriesCount} movimentações)`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total de Saídas: ${data.movements_summary.totalExits} (${data.movements_summary.exitsCount} movimentações)`, 20, yPosition);
    yPosition += 6;
    doc.text(`Saldo Líquido: ${data.movements_summary.totalEntries - data.movements_summary.totalExits}`, 20, yPosition);
    yPosition += 15;
  }

  if (data.orders_summary) {
    doc.setFontSize(fontSize.subtitle);
    doc.setTextColor(primaryColor);
    doc.text('PEDIDOS', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(fontSize.normal);
    doc.setTextColor('black');
    doc.text(`Total de Pedidos: ${data.orders_summary.totalOrders}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Quantidade Total: ${data.orders_summary.totalQuantity} unidades`, 20, yPosition);
    yPosition += 6;
    doc.text(`Concluídos: ${data.orders_summary.completedOrders} | Parciais: ${data.orders_summary.partialOrders} | Pendentes: ${data.orders_summary.pendingOrders}`, 20, yPosition);
    yPosition += 15;
  }

  if (data.readers_status) {
    doc.setFontSize(fontSize.subtitle);
    doc.setTextColor(primaryColor);
    doc.text('LEITORAS', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(fontSize.normal);
    doc.setTextColor('black');
    doc.text(`Total de Leitoras: ${data.readers_status.total}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Disponíveis: ${data.readers_status['Disponível'] || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Em Uso: ${data.readers_status['Em Uso'] || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Em Manutenção: ${data.readers_status['Em Manutenção'] || 0}`, 20, yPosition);
    yPosition += 15;
  }

  if (data.maintenance_summary) {
    doc.setFontSize(fontSize.subtitle);
    doc.setTextColor(primaryColor);
    doc.text('MANUTENÇÃO', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(fontSize.normal);
    doc.setTextColor('black');
    doc.text(`Total de Registros: ${data.maintenance_summary.totalRecords}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Quantidade Total: ${data.maintenance_summary.totalQuantity} unidades`, 20, yPosition);
    yPosition += 6;
    doc.text(`Concluídas: ${data.maintenance_summary.completed} | Em Andamento: ${data.maintenance_summary.inProgress} | Pendentes: ${data.maintenance_summary.pending}`, 20, yPosition);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(fontSize.small);
    doc.setTextColor(secondaryColor);
    doc.text(`Página ${i} de ${pageCount}`, 20, 285);
    doc.text('Sistema de Inventário ZUQ', 150, 285);
  }

  return doc.output('arraybuffer');
}
