
import { useState } from "react";
import { Task } from "@/pages/FluxoTarefas";
import { TaskCard } from "./TaskCard";
import { Clock, AlertTriangle, Calendar, CalendarDays, Inbox, CheckCircle } from "lucide-react";

interface KanbanViewProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: Task['status']) => void;
}

const columns = [
  { 
    id: 'Vencidos', 
    title: 'Vencidos', 
    color: 'border-red-200 bg-red-50', 
    icon: AlertTriangle,
    iconColor: 'text-red-500'
  },
  { 
    id: 'Vence hoje', 
    title: 'Vence hoje', 
    color: 'border-green-200 bg-green-50', 
    icon: Clock,
    iconColor: 'text-green-500'
  },
  { 
    id: 'Esta semana', 
    title: 'Esta semana', 
    color: 'border-blue-200 bg-blue-50', 
    icon: Calendar,
    iconColor: 'text-blue-500'
  },
  { 
    id: 'Próxima semana', 
    title: 'Próxima semana', 
    color: 'border-purple-200 bg-purple-50', 
    icon: CalendarDays,
    iconColor: 'text-purple-500'
  },
  { 
    id: 'Sem prazo', 
    title: 'Sem prazo', 
    color: 'border-gray-200 bg-gray-50', 
    icon: Inbox,
    iconColor: 'text-gray-500'
  },
  { 
    id: 'Concluídos', 
    title: 'Concluídos', 
    color: 'border-gray-300 bg-gray-100', 
    icon: CheckCircle,
    iconColor: 'text-gray-600'
  }
];

export const KanbanView = ({ tasks, onTaskEdit, onMoveTask }: KanbanViewProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    onMoveTask(draggedTask.id, targetStatus as Task['status']);
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[600px]">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        const Icon = column.icon;
        
        return (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} p-4 transition-all duration-200`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`h-5 w-5 ${column.iconColor}`} />
              <h3 className="font-semibold text-gray-700">{column.title}</h3>
              <span className="bg-white/70 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className="cursor-move"
                >
                  <TaskCard 
                    task={task} 
                    onEdit={() => onTaskEdit(task)}
                  />
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
