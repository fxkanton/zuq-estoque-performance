
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEquipmentWithStock } from '@/services/equipmentService';
import { Badge } from '@/components/ui/badge';
import { Package, Layers } from 'lucide-react';

interface CategoryData {
  name: string;
  itemCount: number;
  totalStock: number;
}

interface CategoryInventoryProps {
    startDate: string;
    endDate: string;
}

const CategoryInventory = ({ startDate, endDate }: CategoryInventoryProps) => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryInventory = async () => {
      setLoading(true);
      try {
        const equipment = await getEquipmentWithStock();
        
        const dataByCategory = equipment.reduce((acc: Record<string, { itemCount: number, totalStock: number }>, item) => {
          const category = item.category || "Não especificado";
          if (!acc[category]) {
            acc[category] = { itemCount: 0, totalStock: 0 };
          }
          acc[category].itemCount += 1;
          acc[category].totalStock += item.stock;
          return acc;
        }, {});

        const formattedData: CategoryData[] = Object.entries(dataByCategory)
          .map(([name, data]) => ({
            name,
            ...data,
          }))
          .sort((a, b) => b.totalStock - a.totalStock);
          
        setCategoryData(formattedData);
      } catch (error) {
        console.error("Failed to load category inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryInventory();
  }, [startDate, endDate]);

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Leitora': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sensor': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rastreador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Acessório': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="mb-6 md:mb-8">
      <CardHeader>
        <CardTitle className="text-base md:text-lg font-medium text-zuq-darkblue flex items-center gap-2">
            <Layers className="h-5 w-5 text-zuq-blue" />
            <span>Inventário por Categoria</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zuq-blue"></div>
           </div>
        ) : categoryData.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm md:text-base">Nenhum dado de categoria encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="text-center font-semibold">Itens Únicos</TableHead>
                  <TableHead className="text-right font-semibold">Estoque Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell>
                      <Badge className={`text-xs font-medium border ${getCategoryColor(category.name)}`}>
                          {category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{category.itemCount}</TableCell>
                    <TableCell className="text-right font-bold text-lg text-zuq-darkblue">{category.totalStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryInventory;
