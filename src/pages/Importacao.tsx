
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportUploadArea } from "@/components/import/ImportUploadArea";
import { ImportPreview } from "@/components/import/ImportPreview";
import { ImportHistory } from "@/components/import/ImportHistory";
import { ImportTemplateGuide } from "@/components/import/ImportTemplateGuide";
import { Badge } from "@/components/ui/badge";

export type ImportDataType = 'equipamentos' | 'fornecedores' | 'leitoras' | 'movimentacoes' | 'pedidos';

const Importacao = () => {
  const [selectedDataType, setSelectedDataType] = useState<ImportDataType>('equipamentos');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const dataTypes = [
    { key: 'equipamentos', label: 'Equipamentos', description: 'Importar equipamentos e seus dados' },
    { key: 'fornecedores', label: 'Fornecedores', description: 'Importar fornecedores e contatos' },
    { key: 'leitoras', label: 'Leitoras', description: 'Importar leitoras individuais' },
    { key: 'movimentacoes', label: 'Movimentações', description: 'Importar entradas e saídas' },
    { key: 'pedidos', label: 'Pedidos', description: 'Importar pedidos de compra' },
  ];

  const handleFileUploaded = (file: File, data: any[]) => {
    setUploadedFile(file);
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleBackToUpload = () => {
    setShowPreview(false);
    setUploadedFile(null);
    setPreviewData([]);
  };

  return (
    <MainLayout title="Importar Dados">
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Importar Dados</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Importe dados em massa usando arquivos CSV ou Excel
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="upload" className="text-xs md:text-sm px-2 md:px-3 py-2">
              Upload
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs md:text-sm px-2 md:px-3 py-2">
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm px-2 md:px-3 py-2">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 md:space-y-6">
            {!showPreview ? (
              <>
                {/* Seleção do tipo de dados */}
                <Card>
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="text-lg md:text-xl">Selecione o tipo de dados</CardTitle>
                    <CardDescription className="text-sm">
                      Escolha o tipo de dados que você deseja importar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                      {dataTypes.map((type) => (
                        <Card
                          key={type.key}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedDataType === type.key 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedDataType(type.key as ImportDataType)}
                        >
                          <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base md:text-lg">{type.label}</CardTitle>
                              {selectedDataType === type.key && (
                                <Badge variant="default" className="text-xs">Selecionado</Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs md:text-sm">{type.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Área de upload */}
                <ImportUploadArea
                  dataType={selectedDataType}
                  onFileUploaded={handleFileUploaded}
                />
              </>
            ) : (
              <ImportPreview
                dataType={selectedDataType}
                file={uploadedFile!}
                data={previewData}
                onBack={handleBackToUpload}
              />
            )}
          </TabsContent>

          <TabsContent value="templates">
            <ImportTemplateGuide />
          </TabsContent>

          <TabsContent value="history">
            <ImportHistory />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Importacao;
