
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheet, Info, CheckCircle } from "lucide-react";
import { generateTemplate } from "@/services/importService";
import { toast } from "sonner";

export const ImportTemplateGuide = () => {
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null);

  const handleDownloadTemplate = async (dataType: string) => {
    setDownloadingTemplate(dataType);
    try {
      await generateTemplate(dataType);
      toast.success(`Template de ${dataType} baixado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao baixar template');
    } finally {
      setDownloadingTemplate(null);
    }
  };

  const templateConfigs = {
    equipamentos: {
      label: 'Equipamentos',
      description: 'Template para importação de equipamentos',
      columns: [
        { name: 'marca', type: 'Texto', required: true, description: 'Marca do equipamento' },
        { name: 'modelo', type: 'Texto', required: true, description: 'Modelo do equipamento' },
        { name: 'categoria', type: 'Texto', required: true, description: 'Leitora, Sensor, Rastreador ou Acessório' },
        { name: 'preco_medio', type: 'Número', required: false, description: 'Preço médio em reais' },
        { name: 'estoque_minimo', type: 'Número', required: false, description: 'Estoque mínimo recomendado' },
        { name: 'estoque_inicial', type: 'Número', required: false, description: 'Quantidade inicial em estoque' },
        { name: 'fornecedor_nome', type: 'Texto', required: false, description: 'Nome do fornecedor (deve existir)' },
      ]
    },
    fornecedores: {
      label: 'Fornecedores',
      description: 'Template para importação de fornecedores',
      columns: [
        { name: 'nome', type: 'Texto', required: true, description: 'Nome da empresa fornecedora' },
        { name: 'cnpj', type: 'Texto', required: true, description: 'CNPJ no formato XX.XXX.XXX/XXXX-XX' },
        { name: 'contato', type: 'Texto', required: false, description: 'Nome da pessoa de contato' },
        { name: 'telefone', type: 'Texto', required: false, description: 'Telefone de contato' },
        { name: 'email', type: 'Texto', required: false, description: 'Email de contato' },
        { name: 'endereco', type: 'Texto', required: false, description: 'Endereço completo' },
        { name: 'dias_entrega_media', type: 'Número', required: false, description: 'Média de dias para entrega' },
      ]
    },
    leitoras: {
      label: 'Leitoras',
      description: 'Template para importação de leitoras individuais',
      columns: [
        { name: 'codigo', type: 'Texto', required: true, description: 'Código único da leitora' },
        { name: 'equipamento_marca', type: 'Texto', required: true, description: 'Marca do equipamento (deve existir)' },
        { name: 'equipamento_modelo', type: 'Texto', required: true, description: 'Modelo do equipamento (deve existir)' },
        { name: 'status', type: 'Texto', required: false, description: 'Disponível, Em Uso ou Em Manutenção' },
        { name: 'condicao', type: 'Texto', required: false, description: 'Novo ou Recondicionado' },
        { name: 'data_aquisicao', type: 'Data', required: false, description: 'Data de aquisição no formato DD/MM/AAAA' },
      ]
    },
    movimentacoes: {
      label: 'Movimentações',
      description: 'Template para importação de entradas e saídas',
      columns: [
        { name: 'equipamento_marca', type: 'Texto', required: true, description: 'Marca do equipamento (deve existir)' },
        { name: 'equipamento_modelo', type: 'Texto', required: true, description: 'Modelo do equipamento (deve existir)' },
        { name: 'tipo_movimento', type: 'Texto', required: true, description: 'Entrada ou Saída' },
        { name: 'quantidade', type: 'Número', required: true, description: 'Quantidade movimentada' },
        { name: 'data', type: 'Data', required: false, description: 'Data da movimentação no formato DD/MM/AAAA' },
        { name: 'observacoes', type: 'Texto', required: false, description: 'Observações adicionais' },
      ]
    },
    pedidos: {
      label: 'Pedidos',
      description: 'Template para importação de pedidos de compra',
      columns: [
        { name: 'equipamento_marca', type: 'Texto', required: true, description: 'Marca do equipamento (deve existir)' },
        { name: 'equipamento_modelo', type: 'Texto', required: true, description: 'Modelo do equipamento (deve existir)' },
        { name: 'fornecedor_nome', type: 'Texto', required: true, description: 'Nome do fornecedor (deve existir)' },
        { name: 'quantidade', type: 'Número', required: true, description: 'Quantidade solicitada' },
        { name: 'data_chegada_esperada', type: 'Data', required: false, description: 'Data esperada no formato DD/MM/AAAA' },
        { name: 'nota_fiscal', type: 'Texto', required: false, description: 'Número da nota fiscal' },
        { name: 'observacoes', type: 'Texto', required: false, description: 'Observações do pedido' },
      ]
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Guias e Templates de Importação
          </CardTitle>
          <CardDescription>
            Baixe templates e consulte o formato correto para cada tipo de dados
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Certifique-se de que seus dados estão no formato correto antes de importar. 
          Campos obrigatórios devem ser preenchidos e referências (como fornecedores) devem existir no sistema.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="equipamentos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(templateConfigs).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(templateConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{config.label}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                  <Button
                    onClick={() => handleDownloadTemplate(key)}
                    disabled={downloadingTemplate === key}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingTemplate === key ? 'Baixando...' : 'Baixar Template'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Formato suportado:</strong> CSV (separado por vírgulas) ou Excel (.xlsx, .xls)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-medium mb-3">Colunas do Template:</h4>
                    <div className="grid gap-3">
                      {config.columns.map((column, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{column.name}</span>
                                {column.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {column.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{column.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dicas importantes:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>A primeira linha deve conter os nomes das colunas exatamente como mostrado</li>
                        <li>Datas devem estar no formato DD/MM/AAAA</li>
                        <li>Números decimais devem usar ponto (.) como separador</li>
                        <li>Referências a outros dados (fornecedores, equipamentos) devem existir no sistema</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
