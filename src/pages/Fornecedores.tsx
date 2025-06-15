
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Package, Truck, FileText, List, LayoutGrid, Eye, Edit } from "lucide-react";
import { fetchSuppliers, Supplier } from "@/services/supplierService";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";
import { DataExportDialog } from "@/components/export/DataExportDialog";
import { SupplierViewDialog } from "@/components/suppliers/SupplierViewDialog";
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";

type ViewMode = 'list' | 'cards';

const Fornecedores = () => {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setIsFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadSuppliers();
  };

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

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {supplier.image_url && (
                      <img 
                        src={supplier.image_url} 
                        alt={supplier.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-zuq-darkblue">{supplier.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{supplier.cnpj}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{supplier.contact_name || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{supplier.phone || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{supplier.email || '-'}</span>
                </TableCell>
                <TableCell>
                  {supplier.average_delivery_days !== null ? (
                    <Badge variant="outline" className="text-zuq-blue border-zuq-blue">
                      {supplier.average_delivery_days} dias
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSupplier(supplier)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-10">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCardsView = () => (
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewSupplier(supplier)}
                >
                  Ver Detalhes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditSupplier(supplier)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <MainLayout title="Fornecedores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Fornecedores</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80"
              onClick={handleNewSupplier}
            >
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg">Filtrar Fornecedores</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-zuq-blue hover:bg-zuq-blue/80' : ''}
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' ? 'bg-zuq-blue hover:bg-zuq-blue/80' : ''}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Cards
                </Button>
              </div>
            </div>
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

        {viewMode === 'list' ? renderListView() : renderCardsView()}

        <DataExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />

        <SupplierViewDialog
          supplier={selectedSupplier}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />

        <SupplierFormDialog
          supplier={editingSupplier}
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          onSuccess={handleFormSuccess}
        />
      </div>
    </MainLayout>
  );
};

export default Fornecedores;
