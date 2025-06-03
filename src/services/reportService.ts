
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
  // Configurações de relatório
  async saveReportConfig(config: ReportConfig) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('report_configs')
      .insert({
        user_id: user.id,
        name: config.name,
        kpis: config.kpis
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReportConfigs() {
    const { data, error } = await supabase
      .from('report_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteReportConfig(id: string) {
    const { error } = await supabase
      .from('report_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Histórico de relatórios
  async getReportHistory() {
    const { data, error } = await supabase
      .from('report_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ReportHistory[];
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
