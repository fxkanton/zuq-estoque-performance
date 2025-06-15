
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Save } from "lucide-react";
import { ImportDataType } from "@/pages/Importacao";
import { saveImportData } from "@/services/importService";
import { toast } from "sonner";

interface ImportPreviewProps {
  dataType: ImportDataType;
  file: File;
  data: any[];
  onBack: () => void;
}

export const ImportPreview = ({ dataType, file, data, onBack }: ImportPreviewProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [editedData, setEditedData] = useState(data);

  const validRecords = editedData.filter(record => !record._hasErrors);
  const errorRecords = editedData.filter(record => record._hasErrors);

  const handleSaveImport = async () => {
    if (validRecords.length === 0) {
      toast.error('Não há registros válidos para importar');
      return;
    }

    setIsImporting(true);
    try {
      await saveImportData(dataType, validRecords, file.name);
      toast.success(`${validRecords.length} registros importados com sucesso!`);
      onBack();
    } catch (error: any) {
      toast.error('Erro ao importar dados: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusBadge = (record: any) => {
    if (record._hasErrors) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    return <Badge variant="default">Válido</Badge>;
  };

  const getColumnNames = () => {
    if (editedData.length === 0) return [];
    const firstRecord = editedData[0];
    return Object.keys(firstRecord).filter(key => !key.startsWith('_'));
  };

  const getDataTypeLabel = (type: ImportDataType) => {
    const labels = {
      equipamentos: 'Equipamentos',
      fornecedores: 'Fornecedores', 
      leitoras: 'Leitoras',
      movimentacoes: 'Movimentações',
      pedidos: 'Pedidos'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack} disabled={isImporting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview - {getDataTypeLabel(dataType)}
                </CardTitle>
                <CardDescription>
                  Arquivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSaveImport}
              disabled={validRecords.length === 0 || isImporting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isImporting ? 'Importando...' : `Importar ${validRecords.length} registros`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{editedData.length}</div>
              <div className="text-sm text-muted-foreground">Total de registros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validRecords.length}</div>
              <div className="text-sm text-muted-foreground">Registros válidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorRecords.length}</div>
              <div className="text-sm text-muted-foreground">Registros com erro</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {errorRecords.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorRecords.length} registros contêm erros e não serão importados. 
            Corrija os erros ou remova esses registros antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      {validRecords.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {validRecords.length} registros estão prontos para importação.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Identificados</CardTitle>
          <CardDescription>
            Revise os dados antes de confirmar a importação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Status</TableHead>
                  {getColumnNames().map((column) => (
                    <TableHead key={column} className="capitalize">
                      {column.replace('_', ' ')}
                    </TableHead>
                  ))}
                  <TableHead>Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedData.slice(0, 50).map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {getStatusBadge(record)}
                    </TableCell>
                    {getColumnNames().map((column) => (
                      <TableCell key={column}>
                        {record[column]?.toString() || '-'}
                      </TableCell>
                    ))}
                    <TableCell>
                      {record._errors && record._errors.length > 0 && (
                        <div className="text-sm text-red-600">
                          {record._errors.join(', ')}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {editedData.length > 50 && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando primeiros 50 registros de {editedData.length} total
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
