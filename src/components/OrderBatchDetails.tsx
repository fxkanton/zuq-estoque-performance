
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderBatch } from '@/services/orderService';

interface OrderBatchDetailsProps {
  orderBatches: OrderBatch[];
  isOpen: boolean;
  onClose: () => void;
}

const OrderBatchDetails = ({ orderBatches, isOpen, onClose }: OrderBatchDetailsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalhes dos Recebimentos</DialogTitle>
          <DialogDescription>
            Histórico de todos os recebimentos deste pedido
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {orderBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum recebimento registrado para este pedido.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {batch.received_date 
                        ? new Date(batch.received_date).toLocaleDateString('pt-BR') 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {batch.received_quantity}
                    </TableCell>
                    <TableCell>
                      {batch.invoice_number || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {batch.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderBatchDetails;
