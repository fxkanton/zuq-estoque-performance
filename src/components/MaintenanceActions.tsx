
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceActionsProps {
  maintenanceId: string;
  equipmentName: string;
  maintenanceStatus: string;
  quantity: number;
  sendDate: string;
  onSuccess: () => void;
}

const MaintenanceActions = ({ 
  maintenanceId, 
  equipmentName, 
  maintenanceStatus, 
  quantity,
  sendDate,
  onSuccess 
}: MaintenanceActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);

  const handleDelete = async () => {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', maintenanceId);

    if (error) {
      toast.error('Erro ao excluir registro de manutenção', {
        description: error.message
      });
      return;
    }

    toast.success('Registro de manutenção excluído com sucesso');
    setIsDeleteDialogOpen(false);
    onSuccess();
  };

  const handleReopen = async () => {
    const { error } = await supabase
      .from('maintenance_records')
      .update({ 
        status: 'Em Andamento', 
        completion_date: null 
      })
      .eq('id', maintenanceId);

    if (error) {
      toast.error('Erro ao reabrir manutenção', {
        description: error.message
      });
      return;
    }

    toast.success('Manutenção reaberta com sucesso');
    setIsReopenDialogOpen(false);
    onSuccess();
  };

  return (
    <>
      <div className="flex gap-1">
        {maintenanceStatus === 'Concluído' && (
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 p-0" 
            onClick={() => setIsReopenDialogOpen(true)}
            title="Reabrir Manutenção"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="icon"
          className="text-red-500 h-8 w-8 p-0" 
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Excluir Registro"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-medium">{equipmentName}</p>
              <p className="text-sm text-muted-foreground">
                Status: {maintenanceStatus} - Quantidade: {quantity}
              </p>
              <p className="text-xs text-muted-foreground">
                Data de Envio: {new Date(sendDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Maintenance Dialog */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reabrir Manutenção</DialogTitle>
            <DialogDescription>
              Deseja reabrir esta manutenção? O status será alterado para "Em Andamento".
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border-l-4 border-amber-500 pl-4">
              <p className="font-medium">{equipmentName}</p>
              <p className="text-sm">
                Status Atual: <span className="font-medium text-green-600">Concluído</span>
              </p>
              <p className="text-sm">
                Novo Status: <span className="font-medium text-amber-600">Em Andamento</span>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReopenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleReopen}>
              Reabrir Manutenção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaintenanceActions;
