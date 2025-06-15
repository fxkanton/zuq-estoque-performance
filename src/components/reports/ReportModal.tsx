import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, FileText, Loader2, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_KPIS = [
  { id: 'stock_summary', label: 'Resumo de Estoque', category: 'Estoque' },
  { id: 'stock_alerts', label: 'Alertas de Estoque Baixo', category: 'Estoque' },
  { id: 'stock_value', label: 'Valor Total do Estoque', category: 'Estoque' },
  { id: 'movements_summary', label: 'Resumo de Movimentações', category: 'Movimentações' },
  { id: 'entry_exit_ratio', label: 'Taxa Entrada/Saída', category: 'Movimentações' },
  { id: 'movement_trends', label: 'Tendências de Movimentação', category: 'Movimentações' },
  { id: 'orders_summary', label: 'Resumo de Pedidos', category: 'Pedidos' },
  { id: 'orders_performance', label: 'Performance de Entrega', category: 'Pedidos' },
  { id: 'supplier_performance', label: 'Performance de Fornecedores', category: 'Pedidos' },
  { id: 'readers_status', label: 'Status das Leitoras', category: 'Leitoras' },
  { id: 'readers_usage', label: 'Taxa de Utilização das Leitoras', category: 'Leitoras' },
  { id: 'maintenance_summary', label: 'Resumo de Manutenções', category: 'Manutenção' },
  { id: 'maintenance_costs', label: 'Custos de Manutenção', category: 'Manutenção' },
];

export const ReportModal = ({ isOpen, onClose }: ReportModalProps) => {
  const { toast } = useToast();
  const [reportName, setReportName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateGeneralReport = () => {
    const today = new Date();
    // Data inicial bem antiga para pegar todo o histórico
    setStartDate(new Date('1970-01-01'));
    setEndDate(today);
    setReportName(`Relatório Geral - ${format(today, 'dd/MM/yyyy')}`);
    // Seleciona todos os KPIs disponíveis
    setSelectedKpis(AVAILABLE_KPIS.map(kpi => kpi.id));
    
    toast({
      title: 'Modo de Relatório Geral Ativado',
      description: 'As datas e os KPIs foram preenchidos. Clique em "Gerar Relatório" para continuar.',
    });
  };

  const handleKpiToggle = (kpiId: string) => {
    setSelectedKpis(prev => 
      prev.includes(kpiId) 
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleSelectAllCategory = (category: string) => {
    const categoryKpis = AVAILABLE_KPIS
      .filter(kpi => kpi.category === category)
      .map(kpi => kpi.id);
    
    const allSelected = categoryKpis.every(id => selectedKpis.includes(id));
    
    if (allSelected) {
      setSelectedKpis(prev => prev.filter(id => !categoryKpis.includes(id)));
    } else {
      setSelectedKpis(prev => [...new Set([...prev, ...categoryKpis])]);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate || selectedKpis.length === 0) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const finalReportName = reportName.trim() || `Relatório ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;

    setIsGenerating(true);

    try {
      await reportService.generateReport({
        reportName: finalReportName,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        kpis: selectedKpis
      });

      toast({
        title: 'Relatório gerado com sucesso!',
        description: 'O download foi iniciado automaticamente.',
      });

      onClose();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const groupedKpis = AVAILABLE_KPIS.reduce((acc, kpi) => {
    if (!acc[kpi.category]) {
      acc[kpi.category] = [];
    }
    acc[kpi.category].push(kpi);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_KPIS>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório HTML
          </DialogTitle>
        </DialogHeader>

        <div className="border-b pb-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGenerateGeneralReport}
          >
            <Zap className="mr-2 h-4 w-4" />
            Clique aqui para um relatório geral (até a data de hoje)
          </Button>
        </div>

        <div className="space-y-6">
          {/* Nome do Relatório */}
          <div className="space-y-2">
            <Label htmlFor="reportName">Nome do Relatório</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder={`Relatório ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
            />
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    fromDate={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* KPIs */}
          <div className="space-y-4">
            <Label>Indicadores (KPIs) a incluir</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedKpis).map(([category, kpis]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{category}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllCategory(category)}
                      >
                        {kpis.every(kpi => selectedKpis.includes(kpi.id)) ? 'Desmarcar' : 'Marcar'} Todos
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {kpis.map((kpi) => (
                      <div key={kpi.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={kpi.id}
                          checked={selectedKpis.includes(kpi.id)}
                          onCheckedChange={() => handleKpiToggle(kpi.id)}
                        />
                        <Label htmlFor={kpi.id} className="text-sm">
                          {kpi.label}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancelar
            </Button>
            <Button 
              onClick={generateReport}
              disabled={isGenerating || !startDate || !endDate || selectedKpis.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
