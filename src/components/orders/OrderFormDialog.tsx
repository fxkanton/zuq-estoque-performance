
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Package, Calendar } from 'lucide-react';
import { OrderWithDetails, createOrder, updateOrder, OrderStatus } from '@/services/orderService';
import { fetchEquipment } from '@/services/equipmentService';
import { fetchSuppliers } from '@/services/supplierService';

interface OrderFormDialogProps {
  order: OrderWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Equipment {
  id: string;
  brand: string;
  model: string;
  category: string;
}

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
}

const OrderFormDialog = ({ order, isOpen, onClose, onSuccess }: OrderFormDialogProps) => {
  const [formData, setFormData] = useState({
    equipment_id: '',
    supplier_id: '',
    quantity: 1,
    status: 'Pendente' as OrderStatus,
    expected_arrival_date: '',
    invoice_number: '',
    notes: ''
  });

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const [equipmentData, suppliersData] = await Promise.all([
        fetchEquipment(),
        fetchSuppliers()
      ]);
      setEquipment(equipmentData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      
      if (order) {
        // Editando pedido existente
        setFormData({
          equipment_id: order.equipment_id,
          supplier_id: order.supplier_id,
          quantity: order.quantity,
          status: order.status,
          expected_arrival_date: order.expected_arrival_date || '',
          invoice_number: order.invoice_number || '',
          notes: order.notes || ''
        });
      } else {
        // Novo pedido
        setFormData({
          equipment_id: '',
          supplier_id: '',
          quantity: 1,
          status: 'Pendente',
          expected_arrival_date: '',
          invoice_number: '',
          notes: ''
        });
      }
    }
  }, [isOpen, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (order) {
        // Editando pedido existente
        await updateOrder(order.id, formData);
      } else {
        // Criando novo pedido
        await createOrder(formData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zuq-blue" />
            {order ? 'Editar Pedido' : 'Novo Pedido'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipamento */}
          <div className="space-y-2">
            <Label htmlFor="equipment_id">Equipamento *</Label>
            <Select 
              value={formData.equipment_id} 
              onValueChange={(value) => handleInputChange('equipment_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.brand} {eq.model} ({eq.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Fornecedor *</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(value) => handleInputChange('supplier_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.cnpj})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Parcialmente Recebido">Parcialmente Recebido</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data prevista e Nota fiscal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_arrival_date">Data Prevista de Chegada</Label>
              <Input
                id="expected_arrival_date"
                type="date"
                value={formData.expected_arrival_date}
                onChange={(e) => handleInputChange('expected_arrival_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
              <Input
                id="invoice_number"
                type="text"
                value={formData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                placeholder="Ex: NF-12345"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o pedido..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.equipment_id || !formData.supplier_id}
              className="bg-zuq-blue hover:bg-zuq-blue/80"
            >
              {isLoading ? 'Salvando...' : order ? 'Atualizar Pedido' : 'Criar Pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormDialog;
