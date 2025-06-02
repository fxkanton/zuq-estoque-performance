
import { Task } from "@/pages/FluxoTarefas";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, Paperclip, Users, CheckSquare, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

export const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'badge-red';
      case 'Média': return 'badge-orange';
      case 'Baixa': return 'badge-green';
      default: return 'badge-blue';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = ['badge-purple', 'badge-blue', 'badge-green', 'badge-orange'];
    const index = category.length % colors.length;
    return colors[index];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const formatCreatedAt = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getChecklistStats = (checklist: { id: string; text: string; completed: boolean }[]) => {
    const completed = checklist.filter(item => item.completed).length;
    const total = checklist.length;
    return { completed, total };
  };

  return (
    <div 
      className="kanban-card group"
      onClick={onEdit}
    >
      {/* Header with creator info */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
      </div>

      {/* Creator and creation date */}
      <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
        <User className="h-3 w-3" />
        <span>Criado por {task.createdBy || 'Usuário'}</span>
      </div>
      
      <div className="text-xs text-gray-400 mb-3">
        {formatCreatedAt(task.createdAt)}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Badge className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        <Badge className={getCategoryColor(task.category)}>
          {task.category}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {task.assignee ? task.assignee : 'Não atribuído'}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {task.checklist && task.checklist.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckSquare className="h-3 w-3" />
              <span>{getChecklistStats(task.checklist).completed}/{getChecklistStats(task.checklist).total}</span>
            </div>
          )}
          
          {task.attachments && task.attachments > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments}</span>
            </div>
          )}
          
          {task.comments && task.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle className="h-3 w-3" />
              <span>{task.comments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
