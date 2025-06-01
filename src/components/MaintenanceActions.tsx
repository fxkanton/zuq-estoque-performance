
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Edit, Trash2, RotateCw } from 'lucide-react';
import { 
  updateMaintenanceRecord, 
  deleteMaintenanceRecord, 
  reopenMaintenanceRecord,
  adoptMaintenanceRecord,
  MaintenanceRecord 
} from '@/services/maintenanceService';
import { toast } from '@/components/ui/sonner';
import { useCreatorInfo } from "@/hooks/useCreatorInfo";
import CreatorInfo from "@/components/CreatorInfo";
import AdoptButton from "@/components/AdoptButton";

interface MaintenanceActionsProps {
  record: MaintenanceRecord;
  onUpdate: () => void;
}

const MaintenanceActions = ({ record, onUpdate }: MaintenanceActionsProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [notes, setNotes] = useState(record.notes || '');
  const [technicianNotes, setTechnicianNotes] = useState(record.technician_notes || '');
  const isCompleted = record.status === 'Concluído';
  const isOrphaned = !record.created_by;

  const { creatorInfo } = useCreatorInfo(record.created_by);

  const handleEdit = async () => {
    try {
      await updateMaintenanceRecord(record.id, {
        ...record,
        notes,
        technician_notes: technicianNotes
      });
      toast.success('Registro de manutenção atualizado com sucesso!');
      setIsEditOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast.error('Erro ao atualizar registro de manutenção.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMaintenanceRecord(record.id);
      toast.success('Registro de manutenção excluído com sucesso!');
      setIsDeleteOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      toast.error('Erro ao excluir registro de manutenção.');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMaintenanceRecord(record.id);
      toast.success('Manutenção reaberta com sucesso!');
      setIsReopenOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error reopening maintenance record:', error);
      toast.error('Erro ao reabrir manutenção.');
    }
  };

  const handleAdopt = async () => {
    const result = await adoptMaintenanceRecord(record.id);
    if (result) {
      setIsEditOpen(false);
      onUpdate();
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </Button>
      
      <Button variant="outline" size="sm" className="text-red-500" onClick={() => setIsDeleteOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" /> Excluir
      </Button>

      {isCompleted && (
        <Button variant="outline" size="sm" className="text-amber-500" onClick={() => setIsReopenOpen(true)}>
          <RotateCw className="h-4 w-4 mr-1" /> Reabrir
        </Button>
      )}

      <AdoptButton
        isOrphaned={isOrphaned}
        onAdopt={handleAdopt}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Manutenção</DialogTitle>
            <DialogDescription>
              Atualize as informações deste registro de manutenção.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea 
                className="w-full p-2 border rounded-md"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas do Técnico</label>
              <textarea 
                className="w-full p-2 border rounded-md"
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                rows={3}
              />
            </div>

            <AdoptButton
              isOrphaned={isOrphaned}
              onAdopt={handleAdopt}
              className="self-start"
            />

            <CreatorInfo
              createdBy={record.created_by}
              createdAt={record.created_at}
              creatorName={creatorInfo.creatorName}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Registro de Manutenção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-medium">Equipamento: {record.equipment?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Status: {record.status}</p>
              <p className="text-sm text-muted-foreground">Data de Envio: {new Date(record.send_date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog open={isReopenOpen} onOpenChange={setIsReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Manutenção</DialogTitle>
            <DialogDescription>
              Deseja reabrir esta manutenção? O status será alterado para "Em Andamento".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-l-4 border-amber-500 pl-4">
              <p className="font-medium">Equipamento: {record.equipment?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Status atual: {record.status}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReopenOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleReopen}>Reabrir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceActions;
