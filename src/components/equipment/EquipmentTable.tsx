
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package2, UserPlus } from "lucide-react";
import { Equipment } from "@/services/equipmentService";
import { getCategoryBadgeStyle, getQualityBadgeStyle } from "./utils/equipmentHelpers";

interface EquipmentTableProps {
  equipamentos: Array<Equipment & { stock?: number; creatorName?: string }>;
  onView: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onAdopt: (equipment: Equipment) => void;
}

export const EquipmentTable = ({
  equipamentos,
  onView,
  onEdit,
  onDelete,
  onAdopt
}: EquipmentTableProps) => {
  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status Qualidade</TableHead>
              <TableHead className="text-right">Valor Médio</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum equipamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              equipamentos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={`${item.brand} ${item.model}`} 
                          className="h-20 w-20 object-cover rounded-md cursor-pointer"
                          onClick={() => onView(item)}
                        />
                      ) : (
                        <div className="bg-zuq-gray/30 p-2 h-20 w-20 flex items-center justify-center rounded-md">
                          <Package2 className="h-10 w-10 text-zuq-blue" />
                        </div>
                      )}
                      <span className="cursor-pointer hover:text-zuq-blue" onClick={() => onView(item)}>
                        {item.brand} {item.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeStyle(item.category)}`}>
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getQualityBadgeStyle(item.quality_status || 'Em Teste')}>
                      {item.quality_status || 'Em Teste'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.average_price ? `R$ ${Number(item.average_price).toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <span className={`font-medium ${(item.stock || 0) < (item.min_stock || 0) ? 'text-red-500' : 'text-green-600'}`}>
                        {item.stock || 0}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        / {item.min_stock || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => onDelete(item)}
                      >
                        Excluir
                      </Button>
                      {!item.created_by && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-amber-700 border-amber-300 hover:bg-amber-100"
                          onClick={() => onAdopt(item)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Adotar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
