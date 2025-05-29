
import { Task } from "@/pages/FluxoTarefas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Calendar, Users } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
}

export const ListView = ({ tasks, onTaskEdit }: ListViewProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'badge-red';
      case 'Média': return 'badge-orange';
      case 'Baixa': return 'badge-green';
      default: return 'badge-blue';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vencidos': return 'badge-red';
      case 'Vence hoje': return 'badge-green';
      case 'Esta semana': return 'badge-blue';
      case 'Próxima semana': return 'badge-purple';
      case 'Sem prazo': return 'badge-gray';
      case 'Concluídos': return 'bg-gray-100 text-gray-600';
      default: return 'badge-blue';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="modern-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Tarefa</TableHead>
            <TableHead className="font-semibold">Responsável</TableHead>
            <TableHead className="font-semibold">Vencimento</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow 
              key={task.id} 
              className="table-row-hover cursor-pointer"
              onClick={() => onTaskEdit(task)}
            >
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {task.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-xs bg-gray-100 text-gray-600">
                      {task.category}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    {task.assignee ? (
                      <div className="font-medium">{task.assignee}</div>
                    ) : (
                      <span className="text-gray-400">Não atribuído</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Sem prazo</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskEdit(task);
                  }}
                  className="hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma tarefa encontrada</p>
        </div>
      )}
    </div>
  );
};
