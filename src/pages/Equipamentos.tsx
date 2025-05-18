
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package2, Plus, Search } from "lucide-react";

const Equipamentos = () => {
  return (
    <MainLayout title="Cadastro de Equipamentos">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Equipamentos</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80">
              <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Equipamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo equipamento para cadastro no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" placeholder="Nome do equipamento" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" placeholder="Marca" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input id="modelo" placeholder="Modelo" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leitora">Leitora</SelectItem>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="rastreador">Rastreador</SelectItem>
                      <SelectItem value="acessorio">Acessório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="valor">Valor Médio de Compra</Label>
                  <Input id="valor" placeholder="R$ 0,00" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fornecedor">Fornecedor Padrão</Label>
                  <Select>
                    <SelectTrigger id="fornecedor">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f1">TechSupply LTDA</SelectItem>
                      <SelectItem value="f2">GlobalTech Inc.</SelectItem>
                      <SelectItem value="f3">ElectroComp BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estoque_min">Nível Mínimo de Estoque</Label>
                  <Input id="estoque_min" type="number" placeholder="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="foto">Foto do Equipamento</Label>
                  <Input id="foto" type="file" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="leitora">Leitora</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="rastreador">Rastreador</SelectItem>
                  <SelectItem value="acessorio">Acessório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="f1">TechSupply LTDA</SelectItem>
                  <SelectItem value="f2">GlobalTech Inc.</SelectItem>
                  <SelectItem value="f3">ElectroComp BR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Limpar</Button>
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1">Aplicar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor Médio</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipamentosData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-zuq-gray/30 p-2 rounded-md">
                        <Package2 className="h-4 w-4 text-zuq-blue" />
                      </div>
                      {item.nome}
                    </div>
                  </TableCell>
                  <TableCell>{item.marca}</TableCell>
                  <TableCell>{item.modelo}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(item.categoria)}`}>
                      {item.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">R$ {item.valorMedio.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <span className={`font-medium ${item.estoque < item.estoqueMin ? 'text-red-500' : 'text-green-600'}`}>
                        {item.estoque}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        / {item.estoqueMin}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

const getCategoryBadgeStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case 'leitora':
      return 'bg-blue-100 text-blue-800';
    case 'sensor':
      return 'bg-green-100 text-green-800';
    case 'rastreador':
      return 'bg-purple-100 text-purple-800';
    case 'acessório':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Mock data
const equipamentosData = [
  {
    id: 1,
    nome: 'Sensor de Pressão',
    marca: 'SensorTech',
    modelo: 'SP-2200',
    categoria: 'Sensor',
    valorMedio: 120.50,
    estoque: 12,
    estoqueMin: 20,
  },
  {
    id: 2,
    nome: 'Leitora Bluetooth',
    marca: 'ReadTech',
    modelo: 'LT-450',
    categoria: 'Leitora',
    valorMedio: 450.00,
    estoque: 5,
    estoqueMin: 10,
  },
  {
    id: 3,
    nome: 'Cabo Conector',
    marca: 'ConnectPro',
    modelo: 'CC-100',
    categoria: 'Acessório',
    valorMedio: 15.75,
    estoque: 32,
    estoqueMin: 50,
  },
  {
    id: 4,
    nome: 'Rastreador GPS',
    marca: 'TrackSolutions',
    modelo: 'GPS Mini',
    categoria: 'Rastreador',
    valorMedio: 250.00,
    estoque: 8,
    estoqueMin: 15,
  },
  {
    id: 5,
    nome: 'Sensor de Temperatura',
    marca: 'SensorTech',
    modelo: 'ST-100',
    categoria: 'Sensor',
    valorMedio: 85.25,
    estoque: 22,
    estoqueMin: 20,
  },
];

export default Equipamentos;
