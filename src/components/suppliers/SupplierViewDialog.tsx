
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Mail, Phone, MapPin, Calendar, Building2, User } from "lucide-react";
import { Supplier } from "@/services/supplierService";

interface SupplierViewDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupplierViewDialog = ({ supplier, open, onOpenChange }: SupplierViewDialogProps) => {
  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zuq-darkblue">
            Detalhes do Fornecedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with image and basic info */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zuq-darkblue mb-2">{supplier.name}</h2>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building2 className="h-4 w-4" />
                <span>CNPJ: {supplier.cnpj}</span>
              </div>
              {supplier.contact_name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Contato: {supplier.contact_name}</span>
                </div>
              )}
            </div>
            {supplier.image_url && (
              <img 
                src={supplier.image_url} 
                alt={supplier.name}
                className="h-20 w-20 object-cover rounded-lg border"
              />
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-zuq-blue" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-zuq-blue" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <MapPin className="h-5 w-5 text-zuq-blue" />
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{supplier.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Information */}
          {supplier.average_delivery_days !== null && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Truck className="h-6 w-6 text-zuq-blue" />
              <div>
                <p className="text-sm text-gray-600">Prazo médio de entrega</p>
                <Badge variant="outline" className="text-zuq-blue border-zuq-blue mt-1">
                  {supplier.average_delivery_days} dias
                </Badge>
              </div>
            </div>
          )}

          {/* Timestamps */}
          {supplier.created_at && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Cadastrado em</p>
                <p className="font-medium">
                  {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
