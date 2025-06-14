import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  fetchSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  adoptSupplier,
  Supplier 
} from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorInfo } from "@/hooks/useCreatorInfo";
import CreatorInfo from "@/components/CreatorInfo";
import AdoptButton from "@/components/AdoptButton";

const Fornecedores = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    average_delivery_days: 0
  });

  const { creatorInfo } = useCreatorInfo(currentSupplier?.created_by);

  const loadSuppliers = async () => {
    const data = await fetchSuppliers();
    setSuppliers(data);
    setFilteredSuppliers(data);
  };

  useEffect(() => {
    loadSuppliers();

    // Subscribe to realtime updates
    const suppliersChannel = supabase
      .channel('public:suppliers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'suppliers'
      }, () => {
        loadSuppliers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(suppliersChannel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'average_delivery_days') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 0 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      average_delivery_days: 0
    });
    setCurrentSupplier(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj,
      contact_name: supplier.contact_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      average_delivery_days: supplier.average_delivery_days || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    const result = await createSupplier(formData);
    if (result) {
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateSupplier = async () => {
    if (!currentSupplier) return;
    
    const result = await updateSupplier(currentSupplier.id, formData);
    if (result) {
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteSupplier = async () => {
    if (!currentSupplier) return;
    
    const result = await deleteSupplier(currentSupplier.id);
    if (result) {
      setIsDeleteDialogOpen(false);
      resetForm();
    }
  };

  const handleAdoptSupplier = async (supplierId: string) => {
    const result = await adoptSupplier(supplierId);
    if (result) {
      loadSuppliers();
    }
  };

  // Filter suppliers based on search term
  useEffect(() => {
    let filtered = suppliers;
    
    if (searchTerm) {
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        supplier.cnpj.includes(searchTerm) ||
        (supplier.contact_name && supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const isOrphaned = (supplier: Supplier) => !supplier.created_by;

  return (
    <MainLayout title="Fornecedores">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Gerenciar Fornecedores</h1>
          
          <div className="flex justify-start">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80 w-full sm:w-auto"
              onClick={handleOpenAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Buscar Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <SearchInput
                placeholder="Pesquisar por nome, CNPJ ou contato..."
                className="flex-1"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Prazo Médio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum fornecedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-zuq-gray/30 p-2 rounded-md">
                            <Building2 className="h-4 w-4 text-zuq-blue" />
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            {supplier.contact_name && (
                              <div className="text-sm text-muted-foreground">
                                {supplier.contact_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{supplier.cnpj}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {supplier.phone && <div>{supplier.phone}</div>}
                          {supplier.email && <div className="text-muted-foreground">{supplier.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.average_delivery_days || 0} dias</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenEditDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => handleOpenDeleteDialog(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AdoptButton
                            isOrphaned={isOrphaned(supplier)}
                            onAdopt={() => handleAdoptSupplier(supplier.id)}
                            size="icon"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Supplier Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre um novo fornecedor no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome do fornecedor" 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input 
                    id="cnpj" 
                    placeholder="00.000.000/0000-00" 
                    value={formData.cnpj}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact_name">Nome do Contato</Label>
                  <Input 
                    id="contact_name" 
                    placeholder="Nome da pessoa de contato" 
                    value={formData.contact_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="average_delivery_days">Prazo Médio (dias)</Label>
                  <Input 
                    id="average_delivery_days" 
                    type="number"
                    placeholder="0" 
                    value={formData.average_delivery_days}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="contato@empresa.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea 
                  id="address" 
                  placeholder="Endereço completo do fornecedor" 
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveSupplier}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Supplier Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>
                Atualize as informações do fornecedor
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome do fornecedor" 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input 
                    id="cnpj" 
                    placeholder="00.000.000/0000-00" 
                    value={formData.cnpj}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact_name">Nome do Contato</Label>
                  <Input 
                    id="contact_name" 
                    placeholder="Nome da pessoa de contato" 
                    value={formData.contact_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="average_delivery_days">Prazo Médio (dias)</Label>
                  <Input 
                    id="average_delivery_days" 
                    type="number"
                    placeholder="0" 
                    value={formData.average_delivery_days}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="contato@empresa.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea 
                  id="address" 
                  placeholder="Endereço completo do fornecedor" 
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              {currentSupplier && (
                <>
                  <AdoptButton
                    isOrphaned={isOrphaned(currentSupplier)}
                    onAdopt={() => handleAdoptSupplier(currentSupplier.id)}
                    className="self-start"
                  />
                  <CreatorInfo
                    createdBy={currentSupplier.created_by}
                    createdAt={currentSupplier.created_at}
                    creatorName={creatorInfo.creatorName}
                  />
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateSupplier}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentSupplier && (
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="font-medium">{currentSupplier.name}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {currentSupplier.cnpj}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteSupplier}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Fornecedores;
