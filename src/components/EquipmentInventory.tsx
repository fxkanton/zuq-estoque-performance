
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEquipmentInventory } from '@/services/movementService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Equipment {
  id: string;
  name: string;
  model: string;
  brand: string;
  stock: number;
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
    model: ''
  });
  
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  
  useEffect(() => {
    const loadInventory = async () => {
      const data = await getEquipmentInventory(startDate, endDate);
      setInventory(data);
      setFilteredInventory(data);
      
      // Extract unique brands and models
      const brands = [...new Set(data.map(item => item.brand))];
      setUniqueBrands(brands);
      
      const models = [...new Set(data.map(item => item.model))];
      setUniqueModels(models);
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
        item => item.name.toLowerCase().includes(searchLower) || 
               item.model.toLowerCase().includes(searchLower) || 
               item.brand.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply brand filter
    if (filters.brand && filters.brand !== '') {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    
    // Apply model filter
    if (filters.model && filters.model !== '') {
      filtered = filtered.filter(item => item.model === filters.model);
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
      model: ''
    });
  };
  
  // Updated chart data for vertical bars
  const chartData = filteredInventory.slice(0, 10).map(item => ({
    name: `${item.name.substring(0, 15)}${item.name.length > 15 ? '...' : ''}`,
    estoque: item.stock,
    fullName: `${item.name} ${item.model}`
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
            <Label htmlFor="model" className="mb-2 block text-sm">Modelo</Label>
            <Select 
              value={filters.model} 
              onValueChange={(value) => handleFilterChange('model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os modelos</SelectItem>
                {uniqueModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [value, 'Quantidade']}
                  labelFormatter={(label, props) => props[0].payload.fullName}
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
