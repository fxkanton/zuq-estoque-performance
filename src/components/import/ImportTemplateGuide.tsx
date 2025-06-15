
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheet, Info, CheckCircle } from "lucide-react";
import { generateTemplate } from "@/services/importService";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export const ImportTemplateGuide = () => {
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null);
  const isMobile = useIsMobile();

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
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileSpreadsheet className="h-4 w-4 md:h-5 md:w-5" />
            Guias e Templates de Importação
          </CardTitle>
          <CardDescription className="text-sm">
            Baixe templates e consulte o formato correto para cada tipo de dados
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Importante:</strong> Certifique-se de que seus dados estão no formato correto antes de importar. 
          Campos obrigatórios devem ser preenchidos e referências (como fornecedores) devem existir no sistema.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="equipamentos" className="space-y-4">
        <TabsList className={`${isMobile ? 'flex w-full overflow-x-auto justify-start' : 'grid w-full grid-cols-5'} h-auto`}>
          {Object.entries(templateConfigs).map(([key, config]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className={`${isMobile ? 'flex-shrink-0 px-2 py-2 text-xs' : 'px-3 py-2'} whitespace-nowrap`}
            >
              {isMobile ? config.label.split(' ')[0] : config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(templateConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader className="p-4 md:p-6">
                <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                  <div>
                    <CardTitle className="text-lg md:text-xl">{config.label}</CardTitle>
                    <CardDescription className="text-sm">{config.description}</CardDescription>
                  </div>
                  <Button
                    onClick={() => handleDownloadTemplate(key)}
                    disabled={downloadingTemplate === key}
                    className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
                    size={isMobile ? "sm" : "default"}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingTemplate === key ? 'Baixando...' : 'Baixar Template'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Formato suportado:</strong> CSV (separado por vírgulas) ou Excel (.xlsx, .xls)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-medium mb-3 text-sm md:text-base">Colunas do Template:</h4>
                    <div className="grid gap-2 md:gap-3">
                      {config.columns.map((column, index) => (
                        <div key={index} className={`${isMobile ? 'p-2 border rounded-lg space-y-2' : 'flex items-center justify-between p-3 border rounded-lg'}`}>
                          <div className={`${isMobile ? 'space-y-1' : 'flex items-center gap-3'}`}>
                            <div>
                              <div className={`${isMobile ? 'space-y-1' : 'flex items-center gap-2'}`}>
                                <span className="font-medium text-sm">{column.name}</span>
                                {column.required && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground break-words">
                                {column.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${isMobile ? 'self-start' : ''}`}>
                            {column.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Dicas importantes:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-xs md:text-sm">
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
