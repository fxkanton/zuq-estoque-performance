
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  dueDate?: Date;
  priority: string;
  status: string;
}

export const TaskReminders = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock data - In a real app, this would come from your task service
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Revisar documentação do projeto',
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        priority: 'Alta',
        status: 'Vencidos'
      },
      {
        id: '2',
        title: 'Reunião com equipe de desenvolvimento',
        dueDate: new Date(),
        priority: 'Média',
        status: 'Vence hoje'
      },
      {
        id: '3',
        title: 'Atualizar sistema de inventário',
        dueDate: new Date(),
        priority: 'Alta',
        status: 'Vence hoje'
      }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = mockTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    });

    const duesToday = mockTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    setOverdueTasks(overdue);
    setTodayTasks(duesToday);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-500';
      case 'Média': return 'bg-yellow-500';
      case 'Baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleViewAllTasks = () => {
    navigate('/fluxo-tarefas');
  };

  return (
    <Card className="h-[300px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-zuq-darkblue flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Lembretes de Tarefas
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            {formatTime(currentTime)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 h-[200px] overflow-y-auto">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">
                {overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''} vencida{overdueTasks.length > 1 ? 's' : ''}
              </span>
            </div>
            {overdueTasks.slice(0, 2).map(task => (
              <div key={task.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                {todayTasks.length} tarefa{todayTasks.length > 1 ? 's' : ''} vence{todayTasks.length > 1 ? 'm' : ''} hoje
              </span>
            </div>
            {todayTasks.slice(0, 2).map(task => (
              <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {overdueTasks.length === 0 && todayTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Não há tarefas urgentes no momento</p>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-zuq-blue border-zuq-blue hover:bg-zuq-blue hover:text-white"
            onClick={handleViewAllTasks}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver todas as tarefas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
