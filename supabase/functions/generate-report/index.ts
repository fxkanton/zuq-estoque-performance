
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando geração de relatório...');
    
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reportName, startDate, endDate, kpis } = await req.json();
    console.log('Dados recebidos:', { reportName, startDate, endDate, kpis });

    // Buscar dados
    const [equipmentData, movementsData] = await Promise.all([
      supabaseClient.from('equipment').select('*'),
      supabaseClient
        .from('inventory_movements')
        .select('*')
        .gte('movement_date', startDate)
        .lte('movement_date', endDate)
    ]);

    if (equipmentData.error || movementsData.error) {
      throw new Error('Failed to fetch data');
    }

    // Calcular KPIs básicos
    const stockSummary = {
      totalItems: equipmentData.data?.length || 0,
      totalMovements: movementsData.data?.length || 0
    };

    // Gerar HTML simples
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportName}</title>
</head>
<body>
    <h1>${reportName}</h1>
    <p>Período: ${startDate} - ${endDate}</p>
    <h2>Resumo</h2>
    <p>Total de Equipamentos: ${stockSummary.totalItems}</p>
    <p>Total de Movimentações: ${stockSummary.totalMovements}</p>
</body>
</html>`;

    return new Response(htmlContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${reportName}.html"`
      },
      status: 200,
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
