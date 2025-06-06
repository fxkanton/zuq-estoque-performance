
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar, ExternalLink, Timer } from "lucide-react";
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
    <Card className="h-[300px] overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-blue-100 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Lembretes de Tarefas
          </CardTitle>
          <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20"></div>
              <Timer className="h-4 w-4 text-blue-600 relative z-10" />
            </div>
            <span className="font-mono font-medium">{formatTime(currentTime)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 h-[200px] overflow-y-auto p-4">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                {overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''} vencida{overdueTasks.length > 1 ? 's' : ''}
              </span>
            </div>
            {overdueTasks.slice(0, 2).map(task => (
              <div key={task.id} className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs px-2 py-1 rounded-full shadow-sm`}>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {todayTasks.length} tarefa{todayTasks.length > 1 ? 's' : ''} vence{todayTasks.length > 1 ? 'm' : ''} hoje
              </span>
            </div>
            {todayTasks.slice(0, 2).map(task => (
              <div key={task.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs px-2 py-1 rounded-full shadow-sm`}>
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
            <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium">Não há tarefas urgentes no momento</p>
            <p className="text-xs text-gray-400 mt-1">Você está em dia! 🎉</p>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-zuq-blue border-zuq-blue hover:bg-zuq-blue hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
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
