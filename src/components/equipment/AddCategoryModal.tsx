
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: string) => void;
  existingCategories: string[];
}

export const AddCategoryModal = ({
  open,
  onOpenChange,
  onAddCategory,
  existingCategories
}: AddCategoryModalProps) => {
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedCategory = newCategory.trim();
    
    if (!trimmedCategory) {
      setError('Por favor, insira um nome para a categoria');
      return;
    }
    
    if (existingCategories.some(cat => cat.toLowerCase() === trimmedCategory.toLowerCase())) {
      setError('Esta categoria já existe');
      return;
    }
    
    onAddCategory(trimmedCategory);
    setNewCategory('');
    setError('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNewCategory('');
    setError('');
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
          <DialogDescription>
            Insira o nome da nova categoria de equipamento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              placeholder="Ex: Antena, Gateway, Módulo..."
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                if (error) setError('');
              }}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-zuq-blue hover:bg-zuq-blue/80">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
