import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, FileText, Save, ChevronDown } from "lucide-react";
import { ImportDataType } from "@/pages/Importacao";
import { saveImportData, ImportRecord } from "@/services/importService";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
      return <Badge variant="destructive" className="text-xs">Erro</Badge>;
    }
    if (record._isDuplicate) {
      if (record._userApproved) {
        return <Badge variant="default" className="bg-orange-500 text-xs">Aprovada</Badge>;
      }
      return <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">Duplicata</Badge>;
    }
    return <Badge variant="default" className="text-xs">Válido</Badge>;
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

  const renderMobileRecordCard = (record: ImportRecord, index: number) => (
    <Card key={index} className="mb-3 p-3">
      <div className="flex items-center justify-between mb-2">
        {getStatusBadge(record)}
        {importDuplicates && record._isDuplicate && (
          <Checkbox
            checked={record._userApproved || false}
            onCheckedChange={(checked) => 
              handleDuplicateApproval(index, checked === true)
            }
          />
        )}
      </div>
      
      <div className="space-y-1">
        {getColumnNames().slice(0, 3).map((column) => (
          <div key={column} className="text-sm">
            <span className="font-medium capitalize">{column.replace('_', ' ')}: </span>
            <span>{record[column]?.toString() || '-'}</span>
          </div>
        ))}
        
        {record._errors && record._errors.length > 0 && (
          <div className="text-xs text-red-600 mt-2">
            <strong>Erros:</strong> {record._errors.join(', ')}
          </div>
        )}
        {record._duplicateInfo && record._duplicateInfo.length > 0 && (
          <div className="text-xs text-orange-600 mt-1">
            <strong>Duplicata:</strong> {record._duplicateInfo.join(', ')}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <Button variant="outline" onClick={onBack} disabled={isImporting} size={isMobile ? "sm" : "default"}>
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                Voltar
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">Preview - </span>{getDataTypeLabel(dataType)}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSaveImport}
              disabled={totalToImport === 0 || isImporting}
              className="flex items-center gap-2"
              size={isMobile ? "sm" : "default"}
            >
              <Save className="h-4 w-4" />
              {isImporting ? 'Importando...' : `Importar ${totalToImport}`}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{editedData.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{validRecords.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Válidos</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{duplicateRecords.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Duplicatas</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-red-600">{errorRecords.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Erros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {errorRecords.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {errorRecords.length} registros contêm erros e não serão importados.
          </AlertDescription>
        </Alert>
      )}

      {duplicateRecords.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-3">
              <div className="text-sm">
                {duplicateRecords.length} registros duplicados encontrados.
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="import-duplicates"
                  checked={importDuplicates}
                  onCheckedChange={(checked) => setImportDuplicates(checked === true)}
                />
                <label htmlFor="import-duplicates" className="text-sm font-medium">
                  Permitir importação de duplicatas selecionadas
                </label>
              </div>

              {importDuplicates && (
                <div className="flex flex-col sm:flex-row gap-2">
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
          <AlertDescription className="text-sm">
            {totalToImport} registros estão prontos para importação.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Display */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Dados Identificados</CardTitle>
          <CardDescription className="text-sm">
            Revise os dados antes de confirmar a importação
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {isMobile ? (
            // Mobile: Cards compactos
            <div className="space-y-3">
              {editedData.slice(0, 20).map((record, index) => 
                renderMobileRecordCard(record, index)
              )}
              {editedData.length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando primeiros 20 registros de {editedData.length} total
                </p>
              )}
            </div>
          ) : (
            // Desktop: Tabela com scroll
            <ScrollArea className="w-full">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Status</TableHead>
                      {importDuplicates && <TableHead className="w-20">Aprovar</TableHead>}
                      {getColumnNames().map((column) => (
                        <TableHead key={column} className="capitalize min-w-[120px]">
                          {column.replace('_', ' ')}
                        </TableHead>
                      ))}
                      <TableHead className="min-w-[200px]">Observações</TableHead>
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
                                  handleDuplicateApproval(index, checked === true)
                                }
                              />
                            )}
                          </TableCell>
                        )}
                        {getColumnNames().map((column) => (
                          <TableCell key={column} className="max-w-[150px] truncate">
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
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
