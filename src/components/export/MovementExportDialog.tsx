
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovementExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MovementExportDialog = ({ open, onOpenChange }: MovementExportDialogProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchMovementsData = async () => {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          equipment:equipment_id (
            brand,
            model,
            category
          )
        `)
        .gte('movement_date', startDateStr)
        .lte('movement_date', endDateStr)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      toast({
        title: 'Erro ao buscar dados',
        description: 'Não foi possível carregar as movimentações.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const formatDataForExport = (data: any[]) => {
    return data.map(item => ({
      'Data': new Date(item.movement_date).toLocaleDateString('pt-BR'),
      'Equipamento': item.equipment ? `${item.equipment.brand} ${item.equipment.model}` : 'N/A',
      'Categoria': item.equipment?.category || 'N/A',
      'Tipo de Movimento': item.movement_type,
      'Quantidade': item.quantity,
      'Observações': item.notes || '',
      'Criado em': new Date(item.created_at).toLocaleString('pt-BR'),
    }));
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[], filename: string) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const rawData = await fetchMovementsData();
      
      if (rawData.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não foram encontradas movimentações no período selecionado.',
          variant: 'destructive',
        });
        return;
      }

      const formattedData = formatDataForExport(rawData);
      const startDateStr = format(startDate, 'dd-MM-yyyy');
      const endDateStr = format(endDate, 'dd-MM-yyyy');
      const filename = `movimentacoes_${startDateStr}_a_${endDateStr}`;

      if (exportFormat === 'csv') {
        exportToCSV(formattedData, filename);
      } else {
        exportToExcel(formattedData, filename);
      }

      toast({
        title: 'Exportação concluída!',
        description: `Movimentações exportadas em formato ${exportFormat.toUpperCase()}`,
      });

      onOpenChange(false);

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Movimentações
          </DialogTitle>
          <DialogDescription>
            Selecione o período e formato para exportar as movimentações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Formato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="flex items-center gap-2 flex-1"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('xlsx')}
                  className="flex items-center gap-2 flex-1"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Data Inicial</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-xs",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Data Final</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-xs",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                          initialFocus
                          fromDate={startDate}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !startDate || !endDate}
              className="bg-zuq-blue hover:bg-zuq-blue/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
