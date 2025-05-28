
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEquipmentWithStock } from '@/services/equipmentService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Equipment {
  id: string;
  brand: string;
  model: string;
  stock: number;
  category?: string;
}

interface EquipmentInventoryProps {
  startDate: string;
  endDate: string;
}

const EquipmentInventory = ({ startDate, endDate }: EquipmentInventoryProps) => {
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Equipment[]>([]);
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
    if (filters.brand && filters.brand !== "all") {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    
    // Apply category filter - only if not empty string and not "all"
    if (filters.category && filters.category !== "all") {
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
  
  // Data for VERTICAL bar chart
  const chartData = filteredInventory.slice(0, 10).map(item => ({
    name: (item.brand + " " + item.model).substring(0, 15) + (item.brand.length + item.model.length > 15 ? '...' : ''),
    estoque: item.stock,
    fullName: `${item.brand} ${item.model}`
  }));
  
  const totalStock = filteredInventory.reduce((sum, item) => sum + item.stock, 0);
  
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
                <SelectItem value="">Todas as marcas</SelectItem>
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
                <SelectItem value="">Todas as categorias</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category || "unknown"} value={category || "unknown"}>{category || "Não especificado"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredInventory.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum equipamento encontrado para os filtros selecionados
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {/* Vertical bar chart (instead of horizontal) with increased height */}
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={70} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [value, 'Quantidade']}
                  labelFormatter={(label, props) => {
                    // Safe check before accessing payload properties
                    if (props && props.length > 0 && props[0]?.payload) {
                      return props[0].payload.fullName;
                    }
                    // Fallback to the label if payload is not available
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="estoque" name="Quantidade em Estoque" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentInventory;
