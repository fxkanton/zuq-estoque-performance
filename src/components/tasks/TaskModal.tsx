
import { useState, useEffect } from "react";
import { Task } from "@/pages/FluxoTarefas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskData: Partial<Task>) => void;
}

export const TaskModal = ({ isOpen, onClose, task, onSave }: TaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
    priority: "media" as Task['priority'],
    category: "",
    status: "sem-prazo" as Task['status'],
    assignees: [] as string[]
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate,
        priority: task.priority,
        category: task.category,
        status: task.status,
        assignees: task.assignees
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: undefined,
        priority: "media",
        category: "",
        status: "sem-prazo",
        assignees: []
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da tarefa..."
              className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Adicione uma descrição detalhada..."
              rows={4}
              className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Vencimento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-gray-200 hover:border-zuq-turquoise"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP", { locale: ptBR })
                  ) : (
                    <span className="text-gray-500">Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prioridade</label>
              <Select value={formData.priority} onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Administração">Administração</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={(value: Task['status']) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vencidos">Vencidos</SelectItem>
                <SelectItem value="vence-hoje">Vence hoje</SelectItem>
                <SelectItem value="esta-semana">Esta semana</SelectItem>
                <SelectItem value="proxima-semana">Próxima semana</SelectItem>
                <SelectItem value="sem-prazo">Sem prazo</SelectItem>
                <SelectItem value="concluidos">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary">
              <Save className="h-4 w-4 mr-2" />
              {task ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
