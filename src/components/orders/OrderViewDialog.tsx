
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, FileText, User, Building2, Truck } from 'lucide-react';
import { OrderWithDetails } from '@/services/orderService';

interface OrderViewDialogProps {
  order: OrderWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderViewDialog = ({ order, isOpen, onClose }: OrderViewDialogProps) => {
  if (!order) return null;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Entregue':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zuq-blue" />
            Detalhes do Pedido
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Status e informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className={getStatusBadgeStyle(order.status || 'Pendente')}
                >
                  {order.status || 'Pendente'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantidade</label>
              <p className="mt-1 text-sm">{order.quantity}</p>
            </div>
          </div>

          {/* Equipamento */}
          <div className="border rounded-lg p-4">
            <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Package className="h-4 w-4" />
              Equipamento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Marca</label>
                <p className="mt-1 text-sm">{order.equipment?.brand || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Modelo</label>
                <p className="mt-1 text-sm">{order.equipment?.model || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <p className="mt-1 text-sm">{order.equipment?.category || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Fornecedor */}
          <div className="border rounded-lg p-4">
            <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Building2 className="h-4 w-4" />
              Fornecedor
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="mt-1 text-sm">{order.supplier?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CNPJ</label>
                <p className="mt-1 text-sm">{order.supplier?.cnpj || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Datas e entrega */}
          <div className="border rounded-lg p-4">
            <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Calendar className="h-4 w-4" />
              Informações de Entrega
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Prevista</label>
                <p className="mt-1 text-sm">
                  {order.expected_arrival_date ? 
                    new Date(order.expected_arrival_date).toLocaleDateString('pt-BR') : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nota Fiscal</label>
                <p className="mt-1 text-sm">{order.invoice_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="border rounded-lg p-4">
              <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                <FileText className="h-4 w-4" />
                Observações
              </h3>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Informações de criação */}
          <div className="border rounded-lg p-4">
            <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <User className="h-4 w-4" />
              Informações do Pedido
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Criado em</label>
                <p className="mt-1 text-sm">
                  {order.created_at ? 
                    new Date(order.created_at).toLocaleDateString('pt-BR') : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Última atualização</label>
                <p className="mt-1 text-sm">
                  {order.updated_at ? 
                    new Date(order.updated_at).toLocaleDateString('pt-BR') : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderViewDialog;
