
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { OrderBatch, OrderWithDetails, updateOrderBatch } from '@/services/orderService';

interface OrderBatchEditFormProps {
  batch: OrderBatch;
  order: OrderWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const OrderBatchEditForm = ({ batch, order, isOpen, onClose, onSave }: OrderBatchEditFormProps) => {
  const [formData, setFormData] = useState({
    received_quantity: batch.received_quantity,
    received_date: batch.received_date || '',
    shipping_date: batch.shipping_date || '',
    tracking_code: batch.tracking_code || '',
    invoice_number: batch.invoice_number || '',
    notes: batch.notes || ''
  });

  useEffect(() => {
    setFormData({
      received_quantity: batch.received_quantity,
      received_date: batch.received_date || '',
      shipping_date: batch.shipping_date || '',
      tracking_code: batch.tracking_code || '',
      invoice_number: batch.invoice_number || '',
      notes: batch.notes || ''
    });
  }, [batch]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const result = await updateOrderBatch(batch.id, {
      received_quantity: formData.received_quantity,
      received_date: formData.received_date || undefined,
      shipping_date: formData.shipping_date || undefined,
      tracking_code: formData.tracking_code || undefined,
      invoice_number: formData.invoice_number || undefined,
      notes: formData.notes || undefined
    });

    if (result) {
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Recebimento</DialogTitle>
          <DialogDescription>
            Edite as informações do recebimento
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="received_quantity">Quantidade Recebida *</Label>
              <Input
                id="received_quantity"
                type="number"
                min="1"
                value={formData.received_quantity}
                onChange={(e) => handleInputChange('received_quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="received_date">Data de Recebimento</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => handleInputChange('received_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="shipping_date">Data de Envio</Label>
              <Input
                id="shipping_date"
                type="date"
                value={formData.shipping_date}
                onChange={(e) => handleInputChange('shipping_date', e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="tracking_code">Código de Rastreamento</Label>
              <Input
                id="tracking_code"
                value={formData.tracking_code}
                onChange={(e) => handleInputChange('tracking_code', e.target.value)}
                placeholder="Código de rastreamento"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              placeholder="Número da nota fiscal"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o recebimento..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-zuq-blue hover:bg-zuq-blue/80"
            onClick={handleSave}
            disabled={formData.received_quantity < 1}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderBatchEditForm;
