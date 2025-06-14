
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "@/services/equipmentService";
import { getCategoryBadgeStyle, getQualityBadgeStyle } from "./utils/equipmentHelpers";
import OrphanedRecordBadge from "@/components/OrphanedRecordBadge";

interface EquipmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment & { stock?: number; creatorName?: string } | null;
  onEdit: (equipment: Equipment) => void;
  onAdopt: (equipment: Equipment) => void;
}

export const EquipmentViewDialog = ({
  open,
  onOpenChange,
  equipment,
  onEdit,
  onAdopt
}: EquipmentViewDialogProps) => {
  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Equipamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <OrphanedRecordBadge
            isOrphaned={!equipment.created_by}
            createdBy={equipment.created_by}
            creatorName={equipment.creatorName}
            onAdopt={() => {
              onAdopt(equipment);
              onOpenChange(false);
            }}
            recordType="equipamento"
          />
          
          <div className="grid gap-3">
            <div>
              <h3 className="text-xl font-bold">{equipment.brand} {equipment.model}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(equipment.category)}`}>
                  {equipment.category}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Status de Qualidade</p>
                <Badge variant="outline" className={getQualityBadgeStyle(equipment.quality_status || 'Em Teste')}>
                  {equipment.quality_status || 'Em Teste'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Valor Médio</p>
                <p>{equipment.average_price ? `R$ ${Number(equipment.average_price).toFixed(2)}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Estoque Atual</p>
                <p className={`font-medium ${
                  (equipment.stock || 0) < (equipment.min_stock || 0) 
                    ? 'text-red-500' 
                    : 'text-green-600'}`
                }>
                  {equipment.stock || 0} unidades
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Estoque Mínimo</p>
                <p>{equipment.min_stock || 0} unidades</p>
              </div>
              <div>
                <p className="text-sm font-medium">Saldo Inicial</p>
                <p>{equipment.initial_stock || 0} unidades</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={() => {
            onOpenChange(false);
            onEdit(equipment);
          }}>
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
