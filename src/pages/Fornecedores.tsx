
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Users } from "lucide-react";

const Fornecedores = () => {
  return (
    <MainLayout title="Fornecedores">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Cadastro de Fornecedores</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80">
              <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Preencha os dados do fornecedor para cadastro no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nome">Nome/Razão Social</Label>
                  <Input id="nome" placeholder="Nome completo ou Razão Social" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" placeholder="Endereço completo" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="telefone">Telefone de Contato</Label>
                  <Input id="telefone" placeholder="(00) 00000-0000" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prazo">Prazo Médio de Entrega (dias)</Label>
                  <Input id="prazo" type="number" placeholder="0" />
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
          <CardTitle>Filtrar Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Pesquisar por nome, CNPJ..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
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
                <TableHead>Nome/Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Prazo Médio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedoresData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-zuq-gray/30 p-2 rounded-md">
                        <Users className="h-4 w-4 text-zuq-darkblue" />
                      </div>
                      {item.nome}
                    </div>
                  </TableCell>
                  <TableCell>{item.cnpj}</TableCell>
                  <TableCell>{item.telefone}</TableCell>
                  <TableCell>{item.prazoMedio} dias</TableCell>
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

// Mock data
const fornecedoresData = [
  {
    id: 1,
    nome: "TechSupply LTDA",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 3456-7890",
    endereco: "Av. Paulista, 1000, São Paulo - SP",
    prazoMedio: 15
  },
  {
    id: 2,
    nome: "GlobalTech Inc.",
    cnpj: "23.456.789/0001-01",
    telefone: "(21) 3456-7890",
    endereco: "Rua da Assembleia, 100, Rio de Janeiro - RJ",
    prazoMedio: 7
  },
  {
    id: 3,
    nome: "ElectroComp BR",
    cnpj: "34.567.890/0001-12",
    telefone: "(31) 3456-7890",
    endereco: "Av. Amazonas, 500, Belo Horizonte - MG",
    prazoMedio: 10
  },
  {
    id: 4,
    nome: "SupplySmart Distribuidora",
    cnpj: "45.678.901/0001-23",
    telefone: "(41) 3456-7890",
    endereco: "Rua XV de Novembro, 200, Curitiba - PR",
    prazoMedio: 12
  },
  {
    id: 5,
    nome: "TechImport Comércio",
    cnpj: "56.789.012/0001-34",
    telefone: "(51) 3456-7890",
    endereco: "Av. Ipiranga, 300, Porto Alegre - RS",
    prazoMedio: 20
  }
];

export default Fornecedores;
