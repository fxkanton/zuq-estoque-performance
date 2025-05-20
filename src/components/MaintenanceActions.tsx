import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { updateMaintenance, deleteMaintenance, reopenMaintenance, MaintenanceRecord, MaintenanceStatus } from '@/services/maintenanceService';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';

interface MaintenanceActionsProps {
  maintenance: MaintenanceRecord;
  onActionComplete: () => void;
}

const MaintenanceActions = ({ maintenance, onActionComplete }: MaintenanceActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    notes: maintenance.notes || '',
    technician_notes: maintenance.technician_notes || '',
    expected_completion_date: maintenance.expected_completion_date || '',
    completion_date: maintenance.completion_date || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditMaintenance = async () => {
    try {
      await updateMaintenance(maintenance.id, {
        notes: formData.notes,
        technician_notes: formData.technician_notes,
        expected_completion_date: formData.expected_completion_date || null,
        completion_date: formData.completion_date || null,
      });
      
      setIsEditDialogOpen(false);
      onActionComplete();
    } catch (error) {
      toast.error('Erro ao atualizar registro de manutenção');
      console.error(error);
    }
  };

  const handleDeleteMaintenance = async () => {
    try {
      await deleteMaintenance(maintenance.id);
      
      setIsDeleteDialogOpen(false);
      onActionComplete();
    } catch (error) {
      toast.error('Erro ao excluir registro de manutenção');
      console.error(error);
    }
  };

  const handleReopenMaintenance = async () => {
    try {
      await reopenMaintenance(maintenance.id);
      
      setIsReopenDialogOpen(false);
      onActionComplete();
    } catch (error) {
      toast.error('Erro ao reabrir registro de manutenção');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsEditDialogOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      
      {maintenance.status === 'Concluída' && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsReopenDialogOpen(true)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-500"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Registro de Manutenção</DialogTitle>
            <DialogDescription>
              Atualize as informações de manutenção do equipamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected_completion_date">Previsão de Conclusão</Label>
                <Input
                  id="expected_completion_date"
                  name="expected_completion_date"
                  type="date"
                  value={formData.expected_completion_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="completion_date">Data de Conclusão</Label>
                <Input
                  id="completion_date"
                  name="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="technician_notes">Observações do Técnico</Label>
              <Textarea
                id="technician_notes"
                name="technician_notes"
                rows={4}
                placeholder="Detalhes do diagnóstico e reparo..."
                value={formData.technician_notes}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMaintenance}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteMaintenance}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Manutenção</DialogTitle>
            <DialogDescription>
              Deseja reabrir este registro de manutenção? O status será alterado para 'Em Andamento'.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsReopenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReopenMaintenance}>
              Reabrir Manutenção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceActions;
