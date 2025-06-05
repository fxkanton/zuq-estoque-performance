import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import OrphanedRecordBadge from "@/components/OrphanedRecordBadge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageIcon, Package2, Plus, Search, Upload, UserPlus } from "lucide-react";
import { 
  Equipment, 
  EquipmentCategory, 
  fetchEquipment, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment, 
  getEquipmentWithStock,
  uploadEquipmentImage
} from "@/services/equipmentService";
import { fetchSuppliers, Supplier } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isMemberOrManager } from "@/utils/permissions";

const Equipamentos = () => {
  const { profile } = useAuth();
  
  const [equipamentos, setEquipamentos] = useState<Array<Equipment & { stock?: number; creatorName?: string }>>([]);
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Array<Equipment & { stock?: number; creatorName?: string }>>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>(['Leitora', 'Sensor', 'Rastreador', 'Acessório']);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    category: 'Leitora' as EquipmentCategory,
    average_price: 0,
    min_stock: 0,
    supplier_id: '',
    image_url: '',
    quality_status: 'Em Teste'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    if (!isMemberOrManager(profile?.role)) {
      console.log("User doesn't have access, skipping data load");
      return;
    }

    try {
      console.log("Loading equipment data...");
      const equipmentData = await getEquipmentWithStock();
      console.log("Equipment data loaded:", equipmentData);
      
      // Add creator names to equipment data
      const equipmentWithCreatorNames = await Promise.all(
        equipmentData.map(async (item) => {
          let creatorName = undefined;
          if (item.created_by) {
            try {
              const { data } = await supabase.rpc('get_creator_name', {
                creator_id: item.created_by
              });
              creatorName = data || 'Usuário Desconhecido';
            } catch (error) {
              console.error('Error fetching creator name:', error);
              creatorName = 'Erro ao carregar';
            }
          }
          return {
            ...item,
            creatorName
          };
        })
      );
      
      setEquipamentos(equipmentWithCreatorNames);
      setFilteredEquipamentos(equipmentWithCreatorNames);

      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading equipment data:", error);
      toast.error("Erro ao carregar dados dos equipamentos");
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
        console.log("Equipment table changed, reloading data...");
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
        console.log("Inventory movements changed, reloading data...");
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [profile]);

  const handleAdoptEquipment = async (equipment: Equipment) => {
    if (!profile?.id) return;
    
    try {
      await updateEquipment(equipment.id, { 
        created_by: profile.id 
      });
      toast.success("Equipamento adotado com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error adopting equipment:", error);
      toast.error("Erro ao adotar equipamento");
    }
  };

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
    if (field === 'category' && value === 'new') {
      setShowNewCategoryInput(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({
        ...prev,
        category: newCategory as EquipmentCategory
      }));
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      category: 'Leitora',
      average_price: 0,
      min_stock: 0,
      supplier_id: '',
      image_url: '',
      quality_status: 'Em Teste'
    });
    setCurrentEquipment(null);
    setImageFile(null);
    setImagePreview(null);
    setShowNewCategoryInput(false);
    setNewCategory('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setFormData({
      brand: equipment.brand,
      model: equipment.model,
      category: equipment.category,
      average_price: equipment.average_price || 0,
      min_stock: equipment.min_stock || 0,
      supplier_id: equipment.supplier_id || '',
      image_url: equipment.image_url || '',
      quality_status: equipment.quality_status || 'Em Teste'
    });
    
    // Set image preview if equipment has an image
    if (equipment.image_url) {
      setImagePreview(equipment.image_url);
    } else {
      setImagePreview(null);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleOpenViewDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsViewDialogOpen(true);
  };

  const handleOpenDeleteDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEquipment = async () => {
    try {
      setIsUploading(true);
      
      // First upload image if there is one
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Then save equipment data with the image URL and created_by
      const dataToSave = {
        ...formData,
        image_url: imageUrl,
        created_by: profile?.id
      };
      
      console.log("Saving equipment data:", dataToSave);
      await createEquipment(dataToSave);
      setIsAddDialogOpen(false);
      resetForm();
      loadData(); // Reload data after creation
    } catch (error) {
      console.error("Error creating equipment:", error);
      toast.error("Erro ao criar equipamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!currentEquipment) return;
    
    try {
      setIsUploading(true);
      
      // First upload image if there is one
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Then update equipment data with the image URL
      const dataToUpdate = {
        ...formData,
        image_url: imageUrl
      };
      
      await updateEquipment(currentEquipment.id, dataToUpdate);
      setIsEditDialogOpen(false);
      resetForm();
      loadData(); // Reload data after update
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast.error("Erro ao atualizar equipamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!currentEquipment) return;
    
    try {
      await deleteEquipment(currentEquipment.id);
      setIsDeleteDialogOpen(false);
      resetForm();
      loadData(); // Reload data after deletion
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast.error("Erro ao excluir equipamento");
    }
  };

  const applyFilters = () => {
    let filtered = equipamentos;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    if (qualityFilter && qualityFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.quality_status === qualityFilter
      );
    }
    
    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.supplier_id === supplierFilter
      );
    }
    
    setFilteredEquipamentos(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, qualityFilter, supplierFilter, equipamentos]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setQualityFilter('');
    setSupplierFilter('');
  };

  const getQualityBadgeStyle = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Reprovado':
        return 'bg-red-100 text-red-800';
      case 'Em Teste':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Only render if user has access (member or manager)
  if (!isMemberOrManager(profile?.role)) {
    return (
      <MainLayout title="Cadastro de Equipamentos">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a membros e gerentes.</p>
        </div>
      </MainLayout>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Qualidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                  <SelectItem value="Em Teste">Em Teste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os fornecedores</SelectItem>
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status Qualidade</TableHead>
                <TableHead className="text-right">Valor Médio</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Nenhum equipamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipamentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={`${item.brand} ${item.model}`} 
                            className="h-20 w-20 object-cover rounded-md cursor-pointer"
                            onClick={() => handleOpenViewDialog(item)}
                          />
                        ) : (
                          <div className="bg-zuq-gray/30 p-2 h-20 w-20 flex items-center justify-center rounded-md">
                            <Package2 className="h-10 w-10 text-zuq-blue" />
                          </div>
                        )}
                        <span className="cursor-pointer hover:text-zuq-blue" onClick={() => handleOpenViewDialog(item)}>
                          {item.brand} {item.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(item.category)}`}>
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getQualityBadgeStyle(item.quality_status || 'Em Teste')}>
                        {item.quality_status || 'Em Teste'}
                      </Badge>
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
                        {!item.created_by && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-700 border-amber-300 hover:bg-amber-100"
                            onClick={() => handleAdoptEquipment(item)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Adotar
                          </Button>
                        )}
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
            <div className="flex flex-col gap-2">
              <Label>Imagem do Equipamento</Label>
              <div className="flex flex-col gap-2 items-center border rounded-md p-4 bg-gray-50">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-40 w-40 object-cover rounded-md" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 bg-white"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-40 w-40 mb-2 text-gray-300" />
                    <p>Nenhuma imagem selecionada</p>
                  </div>
                )}
                <div className="w-full mt-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Selecionar Imagem
                  </Button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="brand">Marca</Label>
                <Input 
                  id="brand" 
                  placeholder="Marca" 
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input 
                  id="model" 
                  placeholder="Modelo" 
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoria</Label>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova categoria"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button onClick={handleAddNewCategory}>Adicionar</Button>
                    <Button variant="outline" onClick={() => setShowNewCategoryInput(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="new">+ Nova Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quality_status">Status de Qualidade</Label>
                <Select 
                  value={formData.quality_status} 
                  onValueChange={(value) => handleSelectChange('quality_status', value)}
                >
                  <SelectTrigger id="quality_status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Reprovado">Reprovado</SelectItem>
                    <SelectItem value="Em Teste">Em Teste</SelectItem>
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
                <Label htmlFor="min_stock">Nível Mínimo de Estoque</Label>
                <Input 
                  id="min_stock" 
                  type="number" 
                  placeholder="0" 
                  value={formData.min_stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier_id">Fornecedor Padrão</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveEquipment} disabled={isUploading}>
              {isUploading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
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
          
          {/* Creator info and creation date */}
          {currentEquipment && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Informações de Criação</span>
                  {!currentEquipment.created_by && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                      onClick={() => {
                        handleAdoptEquipment(currentEquipment);
                        setIsEditDialogOpen(false);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Adotar Registro
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Criado por:</strong> {
                      currentEquipment.created_by 
                        ? ((currentEquipment as any).creatorName || 'Carregando...') 
                        : 'Registro órfão (sem responsável)'
                    }
                  </p>
                  {currentEquipment.created_at && (
                    <p>
                      <strong>Data de criação:</strong> {
                        format(new Date(currentEquipment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 py-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="flex flex-col gap-2">
                  <Label>Imagem</Label>
                  <div className="flex flex-col gap-2 items-center border rounded-md p-4 bg-gray-50">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full aspect-square object-cover rounded-md" 
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image_url: '' }));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ImageIcon className="h-20 w-20 mb-2 text-gray-300" />
                        <p className="text-xs">Sem imagem</p>
                      </div>
                    )}
                    <div className="w-full mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Alterar Imagem
                      </Button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input 
                        id="brand" 
                        placeholder="Marca" 
                        value={formData.brand}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input 
                        id="model" 
                        placeholder="Modelo" 
                        value={formData.model}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleSelectChange('category', value as EquipmentCategory)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="quality_status">Status de Qualidade</Label>
                      <Select 
                        value={formData.quality_status} 
                        onValueChange={(value) => handleSelectChange('quality_status', value)}
                      >
                        <SelectTrigger id="quality_status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                          <SelectItem value="Reprovado">Reprovado</SelectItem>
                          <SelectItem value="Em Teste">Em Teste</SelectItem>
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
                      <Label htmlFor="min_stock">Nível Mínimo de Estoque</Label>
                      <Input 
                        id="min_stock" 
                        type="number" 
                        placeholder="0" 
                        value={formData.min_stock}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="supplier_id">Fornecedor Padrão</Label>
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
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateEquipment} disabled={isUploading}>
              {isUploading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Equipment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Equipamento</DialogTitle>
          </DialogHeader>
          {currentEquipment && (
            <div className="space-y-4">
              {/* Creator info and adoption option */}
              <OrphanedRecordBadge
                isOrphaned={!currentEquipment.created_by}
                createdBy={currentEquipment.created_by}
                creatorName={(currentEquipment as any).creatorName}
                onAdopt={() => {
                  handleAdoptEquipment(currentEquipment);
                  setIsViewDialogOpen(false);
                }}
                recordType="equipamento"
              />
              
              <div className="grid gap-3">
                <div>
                  <h3 className="text-xl font-bold">{currentEquipment.brand} {currentEquipment.model}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium">Categoria</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(currentEquipment.category)}`}>
                      {currentEquipment.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status de Qualidade</p>
                    <Badge variant="outline" className={getQualityBadgeStyle(currentEquipment.quality_status || 'Em Teste')}>
                      {currentEquipment.quality_status || 'Em Teste'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Valor Médio</p>
                    <p>{currentEquipment.average_price ? `R$ ${Number(currentEquipment.average_price).toFixed(2)}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estoque Atual</p>
                    <p className={`font-medium ${
                      ((currentEquipment as any).stock || 0) < (currentEquipment.min_stock || 0) 
                        ? 'text-red-500' 
                        : 'text-green-600'}`
                    }>
                      {(currentEquipment as any).stock || 0} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estoque Mínimo</p>
                    <p>{currentEquipment.min_stock || 0} unidades</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
            {currentEquipment && (
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={() => {
                setIsViewDialogOpen(false);
                handleOpenEditDialog(currentEquipment);
              }}>
                Editar
              </Button>
            )}
          </DialogFooter>
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
                <p className="font-medium">{currentEquipment.brand} {currentEquipment.model}</p>
                <p className="text-sm text-muted-foreground">Categoria: {currentEquipment.category}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEquipment}>Excluir</Button>
          </DialogFooter>
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
    case 'acessorio':
    case 'acessório':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default Equipamentos;
