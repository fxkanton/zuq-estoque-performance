
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Download, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { reportService, ReportHistory as ReportHistoryType } from '@/services/reportService';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
  generating: { icon: Loader2, color: 'bg-blue-100 text-blue-800', label: 'Gerando' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Concluído' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Erro' },
};

export const ReportHistory = () => {
  const { toast } = useToast();
  
  const { data: reports, isLoading } = useQuery({
    queryKey: ['report-history'],
    queryFn: reportService.getReportHistory,
  });

  const handleDownload = async (report: ReportHistoryType) => {
    if (!report.file_url) {
      toast({
        title: 'Arquivo não disponível',
        description: 'O arquivo do relatório não está disponível.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await reportService.downloadReport(report.file_url, `${report.report_name}.pdf`);
      toast({
        title: 'Download iniciado',
        description: 'O download do relatório foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível fazer o download do relatório.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum relatório foi gerado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const StatusIcon = statusConfig[report.status].icon;
              
              return (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{report.report_name}</h3>
                        <Badge className={statusConfig[report.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[report.status].label}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Período: {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p>
                          Gerado em: {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                        <p>
                          KPIs incluídos: {report.kpis_included.length} indicadores
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {report.status === 'completed' && report.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
