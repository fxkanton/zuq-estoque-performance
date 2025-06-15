
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { ImportDataType } from "@/pages/Importacao";
import { processImportFile } from "@/services/importService";
import { toast } from "sonner";

interface ImportUploadAreaProps {
  dataType: ImportDataType;
  onFileUploaded: (file: File, data: any[]) => void;
}

export const ImportUploadArea = ({ dataType, onFileUploaded }: ImportUploadAreaProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const data = await processImportFile(file, dataType);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onFileUploaded(file, data);
        setIsProcessing(false);
      }, 500);

    } catch (error: any) {
      setError(error.message || 'Erro ao processar arquivo');
      setIsProcessing(false);
      setProgress(0);
      toast.error('Erro ao processar arquivo');
    }
  }, [dataType, onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivo - {getDataTypeLabel(dataType)}
        </CardTitle>
        <CardDescription>
          Arraste e solte seu arquivo CSV ou Excel aqui, ou clique para selecionar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">
                Solte o arquivo aqui...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporta arquivos CSV, XLS e XLSX (máximo 1 arquivo)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="font-medium">Processando arquivo...</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Validando dados e verificando formato...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato aceito para {getDataTypeLabel(dataType)}:</strong>
            <br />
            Consulte a aba "Guias e Templates" para ver o formato específico e baixar templates.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
