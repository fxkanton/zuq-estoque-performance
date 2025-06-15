
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  existingCategories: string[];
}

export const AddCategoryModal = ({
  open,
  onOpenChange,
  onAddCategory,
  onDeleteCategory,
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

  const handleDeleteCategory = (category: string) => {
    onDeleteCategory(category);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Adicione uma nova categoria ou exclua categorias existentes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Adicionar nova categoria */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Nova Categoria</Label>
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

          {/* Lista de categorias existentes */}
          <div className="space-y-2">
            <Label>Categorias Existentes</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3 bg-gray-50">
              {existingCategories.map(category => (
                <div key={category} className="flex items-center justify-between py-1">
                  <span className="text-sm">{category}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a categoria "{category}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(category)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {existingCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma categoria encontrada
                </p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Fechar
          </Button>
          <Button onClick={handleSubmit} className="bg-zuq-blue hover:bg-zuq-blue/80">
            Adicionar Categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
