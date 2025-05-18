
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Manutencao = () => {
  return (
    <MainLayout title="Controle de Manutenção">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle de Manutenção</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manutenção de Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zuq-gray/30 mb-4">
              <Settings className="h-8 w-8 text-zuq-blue" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Controle de Manutenção Simplificado</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Esta área permite controlar o envio de equipamentos para manutenção,
              registrando todas as informações necessárias para acompanhamento.
            </p>
            <div className="flex gap-4">
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80">Registrar Manutenção</Button>
              <Button variant="outline">Visualizar Histórico</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Manutencao;
