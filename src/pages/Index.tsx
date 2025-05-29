
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BarChart3, Package } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zuq-blue/10 to-zuq-darkblue/10">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png" 
              alt="ZUQ Performance" 
              className="w-10 h-10"
            />
            <h1 className="text-xl font-bold text-zuq-darkblue">ZUQ Performance</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/auth/login">
              <Button variant="outline" className="border-zuq-blue text-zuq-blue hover:bg-zuq-blue hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button className="bg-zuq-blue hover:bg-zuq-blue/90">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-zuq-darkblue mb-6">
            Sistema de Gestão de Inventário
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Controle completo dos seus equipamentos, fornecedores, pedidos e muito mais. 
            Otimize sua gestão com a ZUQ Performance.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="bg-zuq-blue hover:bg-zuq-blue/90">
                Começar Agora
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Package className="h-12 w-12 text-zuq-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Gestão de Equipamentos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Controle completo do seu inventário de equipamentos e leitoras.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-zuq-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Fornecedores</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Gerencie relacionamentos com fornecedores e histórico de pedidos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-zuq-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Relatórios</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Dashboard com métricas e relatórios detalhados em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-zuq-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Sistema seguro com controle de acesso e permissões.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            © 2025 ZUQ Performance. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
