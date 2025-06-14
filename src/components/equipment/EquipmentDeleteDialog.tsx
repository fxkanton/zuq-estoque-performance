
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Equipment, deleteEquipment } from "@/services/equipmentService";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

interface EquipmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSuccess: () => void;
}

export const EquipmentDeleteDialog = ({
  open,
  onOpenChange,
  equipment,
  onSuccess
}: EquipmentDeleteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!equipment) return;
    
    try {
      setIsDeleting(true);
      await deleteEquipment(equipment.id);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast.error("Erro ao excluir equipamento");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {equipment && (
            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-medium">{equipment.brand} {equipment.model}</p>
              <p className="text-sm text-muted-foreground">Categoria: {equipment.category}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
