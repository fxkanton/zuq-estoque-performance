
import { Task } from "@/pages/FluxoTarefas";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, Paperclip, Users, CheckSquare } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

export const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'badge-red';
      case 'media': return 'badge-orange';
      case 'baixa': return 'badge-green';
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

  return (
    <div 
      className="kanban-card group"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
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
        {/* Assignees */}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {task.assignees.length > 0 ? task.assignees.length : 0}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {task.checklist && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckSquare className="h-3 w-3" />
              <span>{task.checklist.completed}/{task.checklist.total}</span>
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
