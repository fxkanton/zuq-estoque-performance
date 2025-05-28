
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
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
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Movement, MovementType, updateMovement, deleteMovement } from '@/services/movementService';
import { Equipment } from '@/services/equipmentService';

interface MovementActionsProps {
  movement: Movement;
  equipment?: Equipment;
  allEquipment: Equipment[];
  onSuccess: () => void;
}

const MovementActions = ({ movement, equipment, allEquipment, onSuccess }: MovementActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    equipment_id: movement.equipment_id,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    movement_date: movement.movement_date ? new Date(movement.movement_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: movement.notes || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 1 : parseInt(value)
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

  const handleUpdateMovement = async () => {
    const result = await updateMovement(movement.id, formData);
    if (result) {
      setIsEditDialogOpen(false);
      onSuccess();
    }
  };

  const handleDeleteMovement = async () => {
    const result = await deleteMovement(movement.id);
    if (result) {
      setIsDeleteDialogOpen(false);
      onSuccess();
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 p-0"
          onClick={() => setIsEditDialogOpen(true)}
          title="Editar Movimentação"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="text-red-500 h-8 w-8 p-0"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Excluir Movimentação"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Edit Movement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da movimentação
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_id">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {allEquipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.brand} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type">Tipo de Movimento</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => handleSelectChange('movement_type', value as MovementType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="movement_date">Data da Movimentação</Label>
              <Input 
                id="movement_date" 
                type="date"
                value={formData.movement_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais da movimentação..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateMovement}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-medium">
                {equipment?.brand} {equipment?.model}
              </p>
              <p className="text-sm text-muted-foreground">
                Tipo: {movement.movement_type} - Quantidade: {movement.quantity}
              </p>
              <p className="text-xs text-muted-foreground">
                Data: {new Date(movement.movement_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteMovement}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MovementActions;
