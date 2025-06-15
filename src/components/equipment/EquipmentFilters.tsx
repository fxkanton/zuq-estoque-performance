
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Supplier } from "@/services/supplierService";

interface EquipmentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  qualityFilter: string;
  setQualityFilter: (value: string) => void;
  supplierFilter: string;
  setSupplierFilter: (value: string) => void;
  categories: string[];
  suppliers: Supplier[];
  onClearFilters: () => void;
}

export const EquipmentFilters = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  qualityFilter,
  setQualityFilter,
  supplierFilter,
  setSupplierFilter,
  categories,
  suppliers,
  onClearFilters
}: EquipmentFiltersProps) => {
  return (
    <Card className="mb-4 md:mb-6">
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-base md:text-lg">Filtrar Equipamentos</CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchInput
              placeholder="Pesquisar..."
              className="w-full"
              icon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={categoryFilter || ""} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={qualityFilter || ""} onValueChange={setQualityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Qualidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Reprovado">Reprovado</SelectItem>
                <SelectItem value="Em Teste">Em Teste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={supplierFilter || ""} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onClearFilters}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
