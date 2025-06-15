
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportOption {
  key: string;
  label: string;
  table: string;
  description: string;
}

const exportOptions: ExportOption[] = [
  {
    key: 'equipment',
    label: 'Equipamentos',
    table: 'equipment',
    description: 'Todos os equipamentos cadastrados'
  },
  {
    key: 'suppliers',
    label: 'Fornecedores',
    table: 'suppliers',
    description: 'Todos os fornecedores cadastrados'
  },
  {
    key: 'orders',
    label: 'Pedidos',
    table: 'orders',
    description: 'Histórico de pedidos'
  },
  {
    key: 'movements',
    label: 'Movimentações',
    table: 'inventory_movements',
    description: 'Movimentações de estoque'
  },
  {
    key: 'maintenance',
    label: 'Manutenções',
    table: 'maintenance_records',
    description: 'Registros de manutenção'
  },
  {
    key: 'readers',
    label: 'Leitoras',
    table: 'readers',
    description: 'Equipamentos leitores'
  },
  {
    key: 'profiles',
    label: 'Usuários',
    table: 'profiles',
    description: 'Perfis de usuários (apenas gerentes)'
  }
];

export const DataExportDialog = ({ open, onOpenChange }: DataExportDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  const isManager = profile?.role === 'gerente';

  // Filtrar opções baseado no papel do usuário
  const availableOptions = exportOptions.filter(option => {
    if (option.key === 'profiles') {
      return isManager;
    }
    return true;
  });

  const handleOptionChange = (optionKey: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionKey]);
    } else {
      setSelectedOptions(prev => prev.filter(key => key !== optionKey));
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar dados de ${tableName}:`, error);
      return [];
    }
  };

  const formatDataForExport = (data: any[], tableName: string) => {
    if (!data.length) return [];

    // Formatação específica para cada tabela
    return data.map(item => {
      const formatted = { ...item };
      
      // Converter UUIDs e timestamps para formato mais legível
      Object.keys(formatted).forEach(key => {
        if (key.includes('_at') && formatted[key]) {
          formatted[key] = new Date(formatted[key]).toLocaleString('pt-BR');
        }
        if (key.includes('date') && formatted[key]) {
          formatted[key] = new Date(formatted[key]).toLocaleDateString('pt-BR');
        }
      });

      return formatted;
    });
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

  const exportToExcel = (datasets: { name: string; data: any[] }[], filename: string) => {
    const workbook = XLSX.utils.book_new();

    datasets.forEach(({ name, data }) => {
      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    });

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExport = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: 'Nenhuma opção selecionada',
        description: 'Selecione pelo menos uma tabela para exportar.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const datasets: { name: string; data: any[] }[] = [];

      for (const optionKey of selectedOptions) {
        const option = availableOptions.find(opt => opt.key === optionKey);
        if (!option) continue;

        const rawData = await fetchTableData(option.table);
        const formattedData = formatDataForExport(rawData, option.table);
        
        datasets.push({
          name: option.label,
          data: formattedData
        });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `dados_zuq_${timestamp}`;

      if (exportFormat === 'csv') {
        // Para CSV, exportar cada tabela separadamente
        datasets.forEach(({ name, data }) => {
          if (data.length > 0) {
            exportToCSV(data, `${filename}_${name.toLowerCase()}`);
          }
        });
      } else {
        // Para Excel, criar um arquivo com múltiplas abas
        exportToExcel(datasets, filename);
      }

      toast({
        title: 'Exportação concluída!',
        description: `Dados exportados em formato ${exportFormat.toUpperCase()}`,
      });

      onOpenChange(false);
      setSelectedOptions([]);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados da Plataforma
          </DialogTitle>
          <DialogDescription>
            Selecione quais dados você deseja exportar e o formato do arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Formato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('xlsx')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {exportFormat === 'csv' 
                  ? 'Cada tabela será exportada em um arquivo CSV separado'
                  : 'Todas as tabelas serão exportadas em um único arquivo Excel com múltiplas abas'
                }
              </p>
            </CardContent>
          </Card>

          {/* Seleção de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dados para Exportar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableOptions.map((option) => (
                  <div key={option.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={option.key}
                      checked={selectedOptions.includes(option.key)}
                      onCheckedChange={(checked) => 
                        handleOptionChange(option.key, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={option.key}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
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
              disabled={isExporting || selectedOptions.length === 0}
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
