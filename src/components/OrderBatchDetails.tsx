
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderBatch, OrderWithDetails } from '@/services/orderService';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import OrderBatchEditForm from './OrderBatchEditForm';
import OrderBatchDeleteDialog from './OrderBatchDeleteDialog';

interface OrderBatchDetailsProps {
  order: OrderWithDetails;
  batches: OrderBatch[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

const OrderBatchDetails = ({ order, batches, isOpen, onClose, onRefresh }: OrderBatchDetailsProps) => {
  const [editingBatch, setEditingBatch] = useState<OrderBatch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<OrderBatch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const totalReceived = batches.reduce((total, batch) => total + batch.received_quantity, 0);
  const progress = (totalReceived / order.quantity) * 100;

  const handleEditBatch = (batch: OrderBatch) => {
    setEditingBatch(batch);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBatch = (batch: OrderBatch) => {
    setDeletingBatch(batch);
    setIsDeleteDialogOpen(true);
  };

  const handleBatchUpdated = async () => {
    setIsEditDialogOpen(false);
    setEditingBatch(null);
    await onRefresh();
  };

  const handleBatchDeleted = async () => {
    setIsDeleteDialogOpen(false);
    setDeletingBatch(null);
    await onRefresh();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes dos Recebimentos</DialogTitle>
            <DialogDescription>
              Histórico de todos os recebimentos deste pedido
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 mb-4">
            <h3 className="font-medium mb-2">Resumo do Pedido</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Data do Pedido:</span>{" "}
                {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Previsão de Chegada:</span>{" "}
                {order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade Total:</span>{" "}
                {order.quantity}
              </div>
              <div>
                <span className="text-muted-foreground">Recebido:</span>{" "}
                {totalReceived} ({Math.round(progress)}%)
              </div>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          
          <div className="py-4">
            {batches.length === 0 ? (
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
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
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
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBatch(batch)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteBatch(batch)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Edit Batch Dialog */}
      {editingBatch && (
        <OrderBatchEditForm
          batch={editingBatch}
          order={order}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingBatch(null);
          }}
          onSave={handleBatchUpdated}
        />
      )}

      {/* Delete Batch Dialog */}
      {deletingBatch && (
        <OrderBatchDeleteDialog
          batch={deletingBatch}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingBatch(null);
          }}
          onConfirm={handleBatchDeleted}
        />
      )}
    </>
  );
};

export default OrderBatchDetails;
