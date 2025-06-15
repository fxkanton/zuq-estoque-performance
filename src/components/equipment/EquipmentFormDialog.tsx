
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Upload } from "lucide-react";
import { Equipment, EquipmentCategory } from "@/services/equipmentService";
import { Supplier } from "@/services/supplierService";
import { useEquipmentForm } from "./hooks/useEquipmentForm";
import { AddCategoryModal } from "./AddCategoryModal";

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null;
  suppliers: Supplier[];
  onSuccess: () => void;
}

export const EquipmentFormDialog = ({
  open,
  onOpenChange,
  equipment,
  suppliers,
  onSuccess
}: EquipmentFormDialogProps) => {
  const {
    formData,
    imagePreview,
    isUploading,
    categories,
    isAddCategoryModalOpen,
    fileInputRef,
    handleInputChange,
    handleSelectChange,
    handleAddCategory,
    handleDeleteCategory,
    handleFileChange,
    resetForm,
    setFormDataFromEquipment,
    handleSaveEquipment,
    handleUpdateEquipment,
    removeImage,
    setIsAddCategoryModalOpen
  } = useEquipmentForm(() => {
    onSuccess();
    onOpenChange(false);
  });

  const isEdit = !!equipment;

  // Set form data when equipment changes
  React.useEffect(() => {
    if (equipment) {
      setFormDataFromEquipment(equipment);
    } else {
      resetForm();
    }
  }, [equipment]);

  const handleSubmit = () => {
    if (isEdit && equipment) {
      handleUpdateEquipment(equipment.id);
    } else {
      handleSaveEquipment();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {isEdit 
                ? 'Atualize as informações do equipamento.' 
                : 'Preencha os dados do novo equipamento para cadastro no sistema.'
              }
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
                      onClick={removeImage}
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
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoria</Label>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="initial_stock">Saldo Inicial</Label>
                <Input 
                  id="initial_stock" 
                  type="number" 
                  placeholder="0" 
                  value={formData.initial_stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="average_price">Valor Médio de Compra</Label>
                <Input 
                  id="average_price" 
                  type="number"
                  step="0.01"
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancelar
            </Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (isEdit ? 'Atualizando...' : 'Salvando...') : (isEdit ? 'Atualizar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCategoryModal
        open={isAddCategoryModalOpen}
        onOpenChange={setIsAddCategoryModalOpen}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        existingCategories={categories}
      />
    </>
  );
};
