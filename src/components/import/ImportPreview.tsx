
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, FileText, Save, ChevronDown } from "lucide-react";
import { ImportDataType } from "@/pages/Importacao";
import { saveImportData, ImportRecord } from "@/services/importService";
import { toast } from "sonner";

interface ImportPreviewProps {
  dataType: ImportDataType;
  file: File;
  data: ImportRecord[];
  onBack: () => void;
}

export const ImportPreview = ({ dataType, file, data, onBack }: ImportPreviewProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [editedData, setEditedData] = useState<ImportRecord[]>(data);
  const [importDuplicates, setImportDuplicates] = useState(false);

  const validRecords = editedData.filter(record => !record._hasErrors && !record._isDuplicate);
  const errorRecords = editedData.filter(record => record._hasErrors);
  const duplicateRecords = editedData.filter(record => record._isDuplicate && !record._hasErrors);
  const duplicatesApproved = duplicateRecords.filter(record => record._userApproved);

  const totalToImport = validRecords.length + (importDuplicates ? duplicatesApproved.length : 0);

  const handleSaveImport = async () => {
    if (totalToImport === 0) {
      toast.error('Não há registros válidos para importar');
      return;
    }

    // Marcar duplicatas como aprovadas se a opção estiver ativada
    const finalData = editedData.map(record => ({
      ...record,
      _userApproved: record._isDuplicate ? (importDuplicates && record._userApproved) : false
    }));

    setIsImporting(true);
    try {
      await saveImportData(dataType, finalData, file.name);
      toast.success(`${totalToImport} registros importados com sucesso!`);
      onBack();
    } catch (error: any) {
      toast.error('Erro ao importar dados: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDuplicateApproval = (index: number, approved: boolean) => {
    const newData = [...editedData];
    newData[index] = { ...newData[index], _userApproved: approved };
    setEditedData(newData);
  };

  const handleApproveAllDuplicates = () => {
    const newData = editedData.map(record => ({
      ...record,
      _userApproved: record._isDuplicate ? true : record._userApproved
    }));
    setEditedData(newData);
  };

  const handleRejectAllDuplicates = () => {
    const newData = editedData.map(record => ({
      ...record,
      _userApproved: record._isDuplicate ? false : record._userApproved
    }));
    setEditedData(newData);
  };

  const getStatusBadge = (record: ImportRecord) => {
    if (record._hasErrors) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (record._isDuplicate) {
      if (record._userApproved) {
        return <Badge variant="default" className="bg-orange-500">Duplicata Aprovada</Badge>;
      }
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Duplicata</Badge>;
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
              disabled={totalToImport === 0 || isImporting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isImporting ? 'Importando...' : `Importar ${totalToImport} registros`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{editedData.length}</div>
              <div className="text-sm text-muted-foreground">Total de registros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validRecords.length}</div>
              <div className="text-sm text-muted-foreground">Registros válidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{duplicateRecords.length}</div>
              <div className="text-sm text-muted-foreground">Duplicatas encontradas</div>
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

      {duplicateRecords.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-3">
              <div>
                {duplicateRecords.length} registros duplicados foram encontrados no sistema. 
                Você pode optar por importar as duplicatas mesmo assim.
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="import-duplicates"
                  checked={importDuplicates}
                  onCheckedChange={setImportDuplicates}
                />
                <label htmlFor="import-duplicates" className="text-sm font-medium">
                  Permitir importação de duplicatas selecionadas
                </label>
              </div>

              {importDuplicates && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleApproveAllDuplicates}>
                    Aprovar Todas
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRejectAllDuplicates}>
                    Rejeitar Todas
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    ({duplicatesApproved.length} de {duplicateRecords.length} aprovadas)
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validRecords.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {totalToImport} registros estão prontos para importação.
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
                  {importDuplicates && <TableHead className="w-20">Aprovar</TableHead>}
                  {getColumnNames().map((column) => (
                    <TableHead key={column} className="capitalize">
                      {column.replace('_', ' ')}
                    </TableHead>
                  ))}
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedData.slice(0, 50).map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {getStatusBadge(record)}
                    </TableCell>
                    {importDuplicates && (
                      <TableCell>
                        {record._isDuplicate && (
                          <Checkbox
                            checked={record._userApproved || false}
                            onCheckedChange={(checked) => 
                              handleDuplicateApproval(index, checked as boolean)
                            }
                          />
                        )}
                      </TableCell>
                    )}
                    {getColumnNames().map((column) => (
                      <TableCell key={column}>
                        {record[column]?.toString() || '-'}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="space-y-1">
                        {record._errors && record._errors.length > 0 && (
                          <div className="text-sm text-red-600">
                            <strong>Erros:</strong> {record._errors.join(', ')}
                          </div>
                        )}
                        {record._duplicateInfo && record._duplicateInfo.length > 0 && (
                          <div className="text-sm text-orange-600">
                            <strong>Duplicata:</strong> {record._duplicateInfo.join(', ')}
                          </div>
                        )}
                      </div>
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
