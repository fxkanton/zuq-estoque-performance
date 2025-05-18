
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

const Leitoras = () => {
  return (
    <MainLayout title="Controle de Leitoras">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle Individual de Leitoras</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Módulo de Rastreamento de Leitoras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zuq-gray/30 mb-4">
              <Database className="h-8 w-8 text-zuq-blue" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Controle Detalhado por Unidade</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Esta área permite o gerenciamento individual de leitoras, com rastreabilidade completa
              e histórico de status para cada unidade.
            </p>
            <div className="flex gap-4">
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80">Cadastrar Nova Leitora</Button>
              <Button variant="outline">Gerar Relatório</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Leitoras;
