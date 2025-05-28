import { useState, useEffect, useRef } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Users, Upload, ImageIcon } from "lucide-react";
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, Supplier } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";

const Fornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    contact_name: '',
    email: '',
    average_delivery_days: 0,
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadSuppliers = async () => {
    try {
      const data = await fetchSuppliers();
      setFornecedores(data);
      setFilteredFornecedores(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  useEffect(() => {
    loadSuppliers();

    // Subscribe to realtime updates
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadSupplierImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `suppliers/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('suppliers')
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('suppliers')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error.message);
      return null;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      address: '',
      phone: '',
      contact_name: '',
      email: '',
      average_delivery_days: 0,
      image_url: ''
    });
    setCurrentSupplier(null);
    setImageFile(null);
    setImagePreview(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      address: supplier.address || '',
      phone: supplier.phone || '',
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      average_delivery_days: supplier.average_delivery_days || 0,
      image_url: supplier.image_url || ''
    });
    
    if (supplier.image_url) {
      setImagePreview(supplier.image_url);
    } else {
      setImagePreview(null);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    try {
      setIsUploading(true);
      
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadSupplierImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const dataToSave = {
        ...formData,
        image_url: imageUrl
      };
      
      await createSupplier(dataToSave);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating supplier:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!currentSupplier) return;
    
    try {
      setIsUploading(true);
      
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadSupplierImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const dataToUpdate = {
        ...formData,
        image_url: imageUrl
      };
      
      await updateSupplier(currentSupplier.id, dataToUpdate);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating supplier:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!currentSupplier) return;
    
    try {
      await deleteSupplier(currentSupplier.id);
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  // Filter suppliers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFornecedores(fornecedores);
      return;
    }
    
    const filtered = fornecedores.filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      supplier.cnpj.includes(searchTerm) ||
      (supplier.contact_name && supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredFornecedores(filtered);
  }, [searchTerm, fornecedores]);

  return (
    <MainLayout title="Fornecedores">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Cadastro de Fornecedores</h1>
        
        <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Pesquisar por nome, CNPJ, contato, email..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSearchTerm('')}
              >
                Limpar
              </Button>
              <Button 
                className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1"
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Prazo Médio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredFornecedores.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="h-12 w-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="bg-zuq-gray/30 p-2 h-12 w-12 flex items-center justify-center rounded-md">
                            <Users className="h-6 w-6 text-zuq-darkblue" />
                          </div>
                        )}
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.cnpj}</TableCell>
                    <TableCell>{item.contact_name || 'N/A'}</TableCell>
                    <TableCell>{item.email || 'N/A'}</TableCell>
                    <TableCell>{item.phone || 'N/A'}</TableCell>
                    <TableCell>{item.average_delivery_days || 0} dias</TableCell>
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

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor para cadastro no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Foto do Fornecedor</Label>
              <div className="flex flex-col gap-2 items-center border rounded-md p-4 bg-gray-50">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-md" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 bg-white"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
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
                    <ImageIcon className="h-32 w-32 mb-2 text-gray-300" />
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
                <Label htmlFor="name">Nome/Razão Social</Label>
                <Input 
                  id="name" 
                  placeholder="Nome completo ou Razão Social" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
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
                  placeholder="Nome do responsável"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
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
              <Input 
                id="address" 
                placeholder="Endereço completo"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input 
                  id="phone" 
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="average_delivery_days">Prazo Médio de Entrega (dias)</Label>
                <Input 
                  id="average_delivery_days" 
                  type="number" 
                  placeholder="0"
                  value={formData.average_delivery_days}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveSupplier} disabled={isUploading}>
              {isUploading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do fornecedor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Foto do Fornecedor</Label>
              <div className="flex flex-col gap-2 items-center border rounded-md p-4 bg-gray-50">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-md" 
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
                    <ImageIcon className="h-32 w-32 mb-2 text-gray-300" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome/Razão Social</Label>
                <Input 
                  id="name" 
                  placeholder="Nome completo ou Razão Social" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
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
                  placeholder="Nome do responsável"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
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
              <Input 
                id="address" 
                placeholder="Endereço completo"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input 
                  id="phone" 
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="average_delivery_days">Prazo Médio de Entrega (dias)</Label>
                <Input 
                  id="average_delivery_days" 
                  type="number" 
                  placeholder="0"
                  value={formData.average_delivery_days}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateSupplier} disabled={isUploading}>
              {isUploading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteSupplier}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Fornecedores;
