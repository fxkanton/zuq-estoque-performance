
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, AlertTriangle, Activity, PackageCheck } from "lucide-react";

const Dashboard = () => {
  return (
    <MainLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total de Equipamentos" 
          value="2,457" 
          trend={{ value: "+12.5%", positive: true }}
          icon={<PackageCheck className="h-8 w-8 text-zuq-blue" />}
        />
        <StatsCard 
          title="Entradas no Mês" 
          value="423" 
          trend={{ value: "+18.2%", positive: true }}
          icon={<ArrowDown className="h-8 w-8 text-green-500" />}
        />
        <StatsCard 
          title="Saídas no Mês" 
          value="387" 
          trend={{ value: "-4.3%", positive: false }}
          icon={<ArrowUp className="h-8 w-8 text-amber-500" />}
        />
        <StatsCard 
          title="Leitoras em Manutenção" 
          value="24" 
          trend={{ value: "+2", positive: false }}
          icon={<Activity className="h-8 w-8 text-red-500" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Rotatividade de Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center text-muted-foreground">
              Gráfico de rotatividade será exibido aqui
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center text-muted-foreground">
              Dados de movimentações recentes serão exibidos aqui
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PendingOrderItem 
                supplier="TechSupply LTDA" 
                product="Sensor XYZ-2000" 
                quantity={150}
                received={75}
                date="23/05/2025"
              />
              <PendingOrderItem 
                supplier="ElectroComp" 
                product="Leitora QRX-750" 
                quantity={25}
                received={0}
                date="28/05/2025"
              />
              <PendingOrderItem 
                supplier="GlobalTech" 
                product="Rastreador GPS-V10" 
                quantity={200}
                received={150}
                date="01/06/2025"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-zuq-darkblue">Alertas de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AlertItem name="Sensor de Pressão SP-2200" currentStock={12} minLevel={20} />
              <AlertItem name="Leitora Bluetooth LT-450" currentStock={5} minLevel={10} />
              <AlertItem name="Cabo Conector CC-100" currentStock={32} minLevel={50} />
              <AlertItem name="Rastreador GPS Mini" currentStock={8} minLevel={15} />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

type StatsCardProps = {
  title: string;
  value: string;
  trend: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
};

const StatsCard = ({ title, value, trend, icon }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-zuq-darkblue">{value}</p>
            <p className={`text-xs mt-2 flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {trend.value} {trend.positive ? 'aumento' : 'redução'}
            </p>
          </div>
          <div className="bg-zuq-gray/30 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type AlertItemProps = {
  name: string;
  currentStock: number;
  minLevel: number;
};

const AlertItem = ({ name, currentStock, minLevel }: AlertItemProps) => {
  const percentage = (currentStock / minLevel) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">{name}</span>
        </div>
        <span className="text-sm font-medium">{currentStock}/{minLevel}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

type PendingOrderItemProps = {
  supplier: string;
  product: string;
  quantity: number;
  received: number;
  date: string;
};

const PendingOrderItem = ({ supplier, product, quantity, received, date }: PendingOrderItemProps) => {
  const percentage = (received / quantity) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <h4 className="text-sm font-medium">{product}</h4>
          <p className="text-xs text-muted-foreground">{supplier}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{received} de {quantity} recebidos</p>
          <p className="text-xs text-muted-foreground">Previsão: {date}</p>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

export default Dashboard;
