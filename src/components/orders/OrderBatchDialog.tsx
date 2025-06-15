
import React, { useState, useEffect } from 'react';
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
import { OrderBatch, OrderWithDetails, fetchOrderBatches } from '@/services/orderService';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import OrderBatchForm from '@/components/OrderBatchForm';
import OrderBatchEditForm from '@/components/OrderBatchEditForm';
import OrderBatchDeleteDialog from '@/components/OrderBatchDeleteDialog';

interface OrderBatchDialogProps {
  order: OrderWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate: () => void;
}

const OrderBatchDialog = ({ order, isOpen, onClose, onOrderUpdate }: OrderBatchDialogProps) => {
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewBatchDialogOpen, setIsNewBatchDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<OrderBatch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<OrderBatch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadBatches = async () => {
    if (!order?.id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchOrderBatches(order.id);
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      loadBatches();
    }
  }, [isOpen, order?.id]);

  const totalReceived = batches.reduce((total, batch) => total + batch.received_quantity, 0);
  const progress = order.quantity > 0 ? (totalReceived / order.quantity) * 100 : 0;
  const remainingQuantity = order.quantity - totalReceived;

  const handleNewBatch = () => {
    setIsNewBatchDialogOpen(true);
  };

  const handleEditBatch = (batch: OrderBatch) => {
    setEditingBatch(batch);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBatch = (batch: OrderBatch) => {
    setDeletingBatch(batch);
    setIsDeleteDialogOpen(true);
  };

  const handleBatchCreated = async () => {
    setIsNewBatchDialogOpen(false);
    await loadBatches();
    onOrderUpdate();
  };

  const handleBatchUpdated = async () => {
    setIsEditDialogOpen(false);
    setEditingBatch(null);
    await loadBatches();
    onOrderUpdate();
  };

  const handleBatchDeleted = async () => {
    setIsDeleteDialogOpen(false);
    setDeletingBatch(null);
    await loadBatches();
    onOrderUpdate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recebimentos do Pedido</DialogTitle>
            <DialogDescription>
              Gerencie os recebimentos parciais deste pedido
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Section */}
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-3">Progresso do Pedido</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{order.quantity}</p>
                <p className="text-sm text-gray-600">Total Pedido</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{totalReceived}</p>
                <p className="text-sm text-gray-600">Recebido</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{remainingQuantity}</p>
                <p className="text-sm text-gray-600">Pendente</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Histórico de Recebimentos</h3>
            <Button 
              onClick={handleNewBatch}
              className="bg-zuq-blue hover:bg-zuq-blue/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </div>

          {/* Batches Table */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando recebimentos...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum recebimento registrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Recebimento</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead>Data Envio</TableHead>
                    <TableHead>Rastreamento</TableHead>
                    <TableHead>Nota Fiscal</TableHead>
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
                        {batch.shipping_date 
                          ? new Date(batch.shipping_date).toLocaleDateString('pt-BR') 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {batch.tracking_code || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {batch.invoice_number || 'N/A'}
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

          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Batch Dialog */}
      <OrderBatchForm
        order={order}
        isOpen={isNewBatchDialogOpen}
        onClose={() => setIsNewBatchDialogOpen(false)}
        onSave={handleBatchCreated}
      />

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

export default OrderBatchDialog;
