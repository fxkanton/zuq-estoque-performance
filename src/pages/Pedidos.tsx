
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

const Pedidos = () => {
  return (
    <MainLayout title="Gestão de Pedidos">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Gestão de Pedidos</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Controle de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zuq-gray/30 mb-4">
              <ClipboardCheck className="h-8 w-8 text-zuq-blue" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Acompanhamento de Pedidos</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Esta área permite gerenciar todo o ciclo de vida dos pedidos, desde a solicitação
              até o recebimento completo, com acompanhamento de lotes e prazos.
            </p>
            <div className="flex gap-4">
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80">Criar Novo Pedido</Button>
              <Button variant="outline">Ver Histórico</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Pedidos;
