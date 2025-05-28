
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface TaskFiltersProps {
  filters: {
    search: string;
    category: string;
    assignee: string;
    priority: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const TaskFilters = ({ filters, onFiltersChange }: TaskFiltersProps) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="modern-card">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20"
          />
        </div>

        {/* Category */}
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todas as categorias</SelectItem>
            <SelectItem value="Qualidade">Qualidade</SelectItem>
            <SelectItem value="Administração">Administração</SelectItem>
            <SelectItem value="Manutenção">Manutenção</SelectItem>
            <SelectItem value="Logística">Logística</SelectItem>
            <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
          <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todas as prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee */}
        <Select value={filters.assignee} onValueChange={(value) => updateFilter('assignee', value)}>
          <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos os responsáveis</SelectItem>
            <SelectItem value="João Silva">João Silva</SelectItem>
            <SelectItem value="Maria Santos">Maria Santos</SelectItem>
            <SelectItem value="Carlos Oliveira">Carlos Oliveira</SelectItem>
            <SelectItem value="Ana Costa">Ana Costa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
