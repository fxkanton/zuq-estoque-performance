
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownUp } from "lucide-react";

const Movimentacoes = () => {
  return (
    <MainLayout title="Entradas e Saídas">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle de Entradas e Saídas</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Movimentações de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zuq-gray/30 mb-4">
              <ArrowDownUp className="h-8 w-8 text-zuq-blue" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Controle de Entradas e Saídas de Estoque</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Esta área permite registrar todas as movimentações de produtos no estoque, 
              tanto entradas quanto saídas, mantendo um histórico completo.
            </p>
            <div className="flex gap-4">
              <Button className="bg-green-600 hover:bg-green-700">Registrar Entrada</Button>
              <Button className="bg-amber-600 hover:bg-amber-700">Registrar Saída</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Movimentacoes;
