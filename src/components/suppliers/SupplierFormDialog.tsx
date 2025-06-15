
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupplier, updateSupplier, Supplier } from "@/services/supplierService";

interface SupplierFormDialogProps {
  supplier?: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SupplierFormDialog = ({ supplier, open, onOpenChange, onSuccess }: SupplierFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    average_delivery_days: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!supplier;

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        cnpj: supplier.cnpj || '',
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        average_delivery_days: supplier.average_delivery_days?.toString() || '',
        image_url: supplier.image_url || ''
      });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        average_delivery_days: '',
        image_url: ''
      });
    }
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supplierData = {
        ...formData,
        average_delivery_days: formData.average_delivery_days ? parseInt(formData.average_delivery_days) : null
      };

      if (isEditing && supplier) {
        await updateSupplier(supplier.id, supplierData);
      } else {
        await createSupplier(supplierData);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zuq-darkblue">
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_delivery_days">Dias de Entrega</Label>
              <Input
                id="average_delivery_days"
                type="number"
                value={formData.average_delivery_days}
                onChange={(e) => setFormData(prev => ({ ...prev, average_delivery_days: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL da Imagem</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-zuq-blue hover:bg-zuq-blue/80">
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
