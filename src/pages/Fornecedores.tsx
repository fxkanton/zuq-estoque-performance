
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Truck, FileText } from "lucide-react";
import { fetchSuppliers, Supplier } from "@/services/supplierService";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";
import { DataExportDialog } from "@/components/export/DataExportDialog";

const Fornecedores = () => {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const loadSuppliers = async () => {
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj.includes(searchTerm) ||
      (supplier.contact_name && supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  if (!isMemberOrManager(profile?.role)) {
    return (
      <MainLayout title="Fornecedores">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a membros e gerentes.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Fornecedores">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Fornecedores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Fornecedores</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80">
              <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" /> Exportar Dados
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtrar Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por nome, CNPJ ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum fornecedor encontrado</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-zuq-darkblue mb-1">
                        {supplier.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-2">CNPJ: {supplier.cnpj}</p>
                      {supplier.contact_name && (
                        <p className="text-sm text-gray-600">Contato: {supplier.contact_name}</p>
                      )}
                    </div>
                    {supplier.image_url && (
                      <img 
                        src={supplier.image_url} 
                        alt={supplier.name}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {supplier.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {supplier.email}
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Telefone:</span> {supplier.phone}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Endereço:</span> {supplier.address}
                      </p>
                    )}
                    {supplier.average_delivery_days !== null && (
                      <div className="flex items-center gap-2 mt-3">
                        <Truck className="h-4 w-4 text-zuq-blue" />
                        <Badge variant="outline" className="text-zuq-blue border-zuq-blue">
                          {supplier.average_delivery_days} dias de entrega
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Detalhes
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DataExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Fornecedores;
