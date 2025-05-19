
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { OrderBatch, createOrderBatch } from '@/services/orderService';

interface OrderBatchFormProps {
  orderId: string;
  maxQuantity: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderBatchForm = ({ orderId, maxQuantity, isOpen, onClose, onSuccess }: OrderBatchFormProps) => {
  const [formData, setFormData] = useState<Omit<OrderBatch, 'id' | 'created_at' | 'updated_at'>>({
    order_id: orderId,
    received_quantity: 0,
    received_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'received_quantity') {
      const quantity = parseInt(value);
      // Ensure quantity doesn't exceed max
      setFormData(prev => ({
        ...prev,
        [id]: isNaN(quantity) ? 0 : Math.min(quantity, maxQuantity)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (formData.received_quantity <= 0) {
      return;
    }

    const result = await createOrderBatch(formData);
    
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            Informe os detalhes do recebimento deste pedido
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="received_quantity">Quantidade Recebida</Label>
              <Input
                id="received_quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={formData.received_quantity}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {maxQuantity}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="received_date">Data do Recebimento</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
            <Input
              id="invoice_number"
              placeholder="Número da nota fiscal"
              value={formData.invoice_number}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o recebimento..."
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-zuq-blue hover:bg-zuq-blue/80"
            onClick={handleSubmit}
            disabled={formData.received_quantity <= 0}
          >
            Registrar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderBatchForm;
