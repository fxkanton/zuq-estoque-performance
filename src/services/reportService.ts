
import { generateReportLocal } from './reportGenerationService';
import { supabase } from '@/integrations/supabase/client';

export interface ReportConfig {
  id?: string;
  name: string;
  kpis: string[];
}

export interface ReportHistory {
  id: string;
  report_name: string;
  period_start: string;
  period_end: string;
  kpis_included: string[];
  file_url?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export const reportService = {
  // Gerar relatório usando abordagem local
  async generateReport(data: {
    reportName: string;
    startDate: string;
    endDate: string;
    kpis: string[];
  }) {
    const reportData = {
      reportId: crypto.randomUUID(),
      reportName: data.reportName,
      startDate: data.startDate,
      endDate: data.endDate,
      kpis: data.kpis
    };

    return await generateReportLocal(reportData);
  },

  // Buscar histórico de relatórios
  async getReportHistory(): Promise<ReportHistory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('report_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Erro ao buscar histórico de relatórios');
    }

    // Transform the data to match our interface, ensuring kpis_included is a string array
    const transformedData: ReportHistory[] = (data || []).map(item => ({
      id: item.id,
      report_name: item.report_name,
      period_start: item.period_start,
      period_end: item.period_end,
      kpis_included: Array.isArray(item.kpis_included) ? item.kpis_included as string[] : [],
      file_url: item.file_url,
      status: item.status as 'pending' | 'generating' | 'completed' | 'failed',
      created_at: item.created_at,
      completed_at: item.completed_at
    }));

    return transformedData;
  },

  async downloadReport(fileUrl: string, fileName: string) {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      throw new Error('Erro ao fazer download do relatório');
    }
  }
};
