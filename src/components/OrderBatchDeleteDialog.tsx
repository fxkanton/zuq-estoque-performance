
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderBatch, deleteOrderBatch } from '@/services/orderService';

interface OrderBatchDeleteDialogProps {
  batch: OrderBatch;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const OrderBatchDeleteDialog = ({ batch, isOpen, onClose, onConfirm }: OrderBatchDeleteDialogProps) => {
  const handleDelete = async () => {
    const result = await deleteOrderBatch(batch.id);
    
    if (result) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Data:</strong> {batch.received_date 
              ? new Date(batch.received_date).toLocaleDateString('pt-BR') 
              : 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Quantidade:</strong> {batch.received_quantity}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Nota Fiscal:</strong> {batch.invoice_number || 'N/A'}
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
          >
            Excluir Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderBatchDeleteDialog;
