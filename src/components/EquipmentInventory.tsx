import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEquipmentWithStock } from '@/services/equipmentService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Equipment {
  id: string;
  brand: string;
  model: string;
  stock: number;
  category?: string;
  min_stock?: number;
}

interface EquipmentInventoryProps {
  startDate: string;
  endDate: string;
}

const EquipmentInventory = ({ startDate, endDate }: EquipmentInventoryProps) => {
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Equipment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    category: ''
  });
  
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const loadInventory = async () => {
      const data = await getEquipmentWithStock();
      
      setInventory(data);
      setFilteredInventory(data);
      
      // Extract unique brands and categories
      const brands = [...new Set(data.map(item => item.brand))];
      setUniqueBrands(brands);
      
      const categories = [...new Set(data.map(item => item.category))];
      setUniqueCategories(categories);
    };
    
    loadInventory();
  }, [startDate, endDate]);
  
  useEffect(() => {
    // Start with all inventory
    let filtered = [...inventory];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        item => item.brand.toLowerCase().includes(searchLower) || 
               item.model.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply brand filter - only if not empty string and not "all"
    if (filters.brand && filters.brand !== "all" && filters.brand !== "todas") {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    
    // Apply category filter - only if not empty string and not "all"
    if (filters.category && filters.category !== "all" && filters.category !== "todas") {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    
    // Sort by stock (highest first)
    filtered = [...filtered].sort((a, b) => b.stock - a.stock);
    
    setFilteredInventory(filtered);
  }, [filters, inventory]);
  
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      brand: '',
      category: ''
    });
  };
  
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Leitora': return 'bg-blue-100 text-blue-700';
      case 'Sensor': return 'bg-green-100 text-green-700';
      case 'Rastreador': return 'bg-purple-100 text-purple-700';
      case 'Acessório': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getStockStatus = (item: Equipment) => {
    if (item.min_stock && item.stock < item.min_stock) {
      return { color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4 text-red-500" />, label: 'Baixo' };
    }
    return { color: 'text-green-600', icon: <Package className="h-4 w-4 text-green-500" />, label: 'Normal' };
  };
  
  const totalStock = filteredInventory.reduce((sum, item) => sum + item.stock, 0);
  
  // Get items to display based on expansion state
  const displayedItems = isExpanded ? filteredInventory : filteredInventory.slice(0, 10);
  const hasMoreItems = filteredInventory.length > 10;
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-zuq-darkblue flex justify-between items-center">
          <span>Inventário de Equipamentos</span>
          <span className="text-sm font-normal">Total: <strong>{totalStock}</strong> unidades</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="search" className="mb-2 block text-sm">Pesquisar</Label>
            <Input
              id="search"
              placeholder="Nome do equipamento..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="brand" className="mb-2 block text-sm">Marca</Label>
            <Select 
              value={filters.brand} 
              onValueChange={(value) => handleFilterChange('brand', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as marcas</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="category" className="mb-2 block text-sm">Categoria</Label>
            <Select 
              value={filters.category} 
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category || "unknown"} value={category || "unknown"}>{category || "Não especificado"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredInventory.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum equipamento encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <>
            <div className="modern-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Equipamento</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold text-center">Estoque</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow 
                        key={item.id} 
                        className="table-row-hover"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{item.brand}</div>
                            <div className="text-sm text-gray-500">{item.model}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                            {item.category || "Não especificado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-semibold text-gray-900">{item.stock}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {stockStatus.icon}
                            <span className={`text-sm font-medium ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {hasMoreItems && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Expandir ({filteredInventory.length - 10} itens restantes)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentInventory;
