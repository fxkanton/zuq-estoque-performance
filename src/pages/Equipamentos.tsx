
import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package2, Plus, Search } from "lucide-react";
import { 
  Equipment, 
  EquipmentCategory, 
  fetchEquipment, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment, 
  getEquipmentWithStock
} from "@/services/equipmentService";
import { fetchSuppliers, Supplier } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";

const Equipamentos = () => {
  const [equipamentos, setEquipamentos] = useState<Array<Equipment & { stock?: number }>>([]);
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Array<Equipment & { stock?: number }>>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  
  // Form state
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'Leitora' as EquipmentCategory,
    average_price: 0,
    min_stock: 0,
    supplier_id: '',
    image_url: ''
  });

  const loadData = async () => {
    try {
      const equipmentData = await getEquipmentWithStock();
      setEquipamentos(equipmentData);
      setFilteredEquipamentos(equipmentData);

      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading equipment data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const equipmentChannel = supabase
      .channel('public:equipment')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment'
      }, () => {
        loadData();
      })
      .subscribe();

    const movementsChannel = supabase
      .channel('public:inventory_movements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_movements'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    // Convert numeric values
    if (id === 'average_price' || id === 'min_stock') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      model: '',
      category: 'Leitora',
      average_price: 0,
      min_stock: 0,
      supplier_id: '',
      image_url: ''
    });
    setCurrentEquipment(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setFormData({
      name: equipment.name,
      brand: equipment.brand,
      model: equipment.model,
      category: equipment.category,
      average_price: equipment.average_price || 0,
      min_stock: equipment.min_stock || 0,
      supplier_id: equipment.supplier_id || '',
      image_url: equipment.image_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEquipment = async () => {
    try {
      await createEquipment(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating equipment:", error);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!currentEquipment) return;
    
    try {
      await updateEquipment(currentEquipment.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating equipment:", error);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!currentEquipment) return;
    
    try {
      await deleteEquipment(currentEquipment.id);
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting equipment:", error);
    }
  };

  const applyFilters = () => {
    let filtered = equipamentos;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter && categoryFilter !== 'todos') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    if (supplierFilter && supplierFilter !== 'todos') {
      filtered = filtered.filter(item => 
        item.supplier_id === supplierFilter
      );
    }
    
    setFilteredEquipamentos(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, supplierFilter, equipamentos]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSupplierFilter('');
  };

  return (
    <MainLayout title="Cadastro de Equipamentos">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Equipamentos</h1>
        
        <Button 
          className="bg-zuq-blue hover:bg-zuq-blue/80"
          onClick={handleOpenAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
        </Button>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="leitora">Leitora</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="rastreador">Rastreador</SelectItem>
                  <SelectItem value="acessorio">Acessório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleClearFilters}
              >
                Limpar
              </Button>
              <Button 
                className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1"
                onClick={applyFilters}
              >
                Aplicar
              </Button>
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
              {filteredEquipamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum equipamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipamentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          <Package2 className="h-4 w-4 text-zuq-blue" />
                        </div>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(item.category)}`}>
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.average_price ? `R$ ${Number(item.average_price).toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-medium ${(item.stock || 0) < (item.min_stock || 0) ? 'text-red-500' : 'text-green-600'}`}>
                          {item.stock || 0}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {item.min_stock || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenEditDialog(item)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => handleOpenDeleteDialog(item)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  placeholder="Nome do equipamento" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="marca">Marca</Label>
                <Input 
                  id="brand" 
                  placeholder="Marca" 
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input 
                  id="model" 
                  placeholder="Modelo" 
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leitora">Leitora</SelectItem>
                    <SelectItem value="Sensor">Sensor</SelectItem>
                    <SelectItem value="Rastreador">Rastreador</SelectItem>
                    <SelectItem value="Acessório">Acessório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="average_price">Valor Médio de Compra</Label>
                <Input 
                  id="average_price" 
                  type="number"
                  placeholder="R$ 0,00" 
                  value={formData.average_price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fornecedor">Fornecedor Padrão</Label>
                <Select 
                  value={formData.supplier_id} 
                  onValueChange={(value) => handleSelectChange('supplier_id', value)}
                >
                  <SelectTrigger id="supplier_id">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="min_stock">Nível Mínimo de Estoque</Label>
                <Input 
                  id="min_stock" 
                  type="number" 
                  placeholder="0" 
                  value={formData.min_stock}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input 
                  id="image_url" 
                  placeholder="https://..." 
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveEquipment}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do equipamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input 
                  id="name" 
                  placeholder="Nome do equipamento" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-brand">Marca</Label>
                <Input 
                  id="brand" 
                  placeholder="Marca" 
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input 
                  id="model" 
                  placeholder="Modelo" 
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value as EquipmentCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leitora">Leitora</SelectItem>
                    <SelectItem value="Sensor">Sensor</SelectItem>
                    <SelectItem value="Rastreador">Rastreador</SelectItem>
                    <SelectItem value="Acessório">Acessório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-price">Valor Médio de Compra</Label>
                <Input 
                  id="average_price" 
                  type="number"
                  placeholder="R$ 0,00" 
                  value={formData.average_price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-supplier">Fornecedor Padrão</Label>
                <Select 
                  value={formData.supplier_id} 
                  onValueChange={(value) => handleSelectChange('supplier_id', value)}
                >
                  <SelectTrigger id="edit-supplier">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-min-stock">Nível Mínimo de Estoque</Label>
                <Input 
                  id="min_stock" 
                  type="number" 
                  placeholder="0" 
                  value={formData.min_stock}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-image">URL da Imagem</Label>
                <Input 
                  id="image_url" 
                  placeholder="https://..." 
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateEquipment}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentEquipment && (
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-medium">{currentEquipment.name}</p>
                <p className="text-sm text-muted-foreground">{currentEquipment.brand} {currentEquipment.model}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEquipment}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
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

export default Equipamentos;
