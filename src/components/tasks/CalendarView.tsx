
import { useState } from "react";
import { Task } from "@/pages/FluxoTarefas";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
}

export const CalendarView = ({ tasks, onTaskEdit }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 border-red-200 text-red-700';
      case 'media': return 'bg-orange-100 border-orange-200 text-orange-700';
      case 'baixa': return 'bg-green-100 border-green-200 text-green-700';
      default: return 'bg-blue-100 border-blue-200 text-blue-700';
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate.toDateString() === date.toDateString();
    });
  };

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {formatMonth(currentDate)}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
            className={viewMode === 'month' ? 'btn-primary' : 'hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise'}
          >
            Mês
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' ? 'btn-primary' : 'hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise'}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="modern-card overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b bg-gray-50/50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                  !isCurrentMonthDay ? 'bg-gray-50/30' : 'bg-white'
                } ${isTodayDate ? 'bg-zuq-turquoise/5' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  !isCurrentMonthDay ? 'text-gray-400' : 
                  isTodayDate ? 'text-zuq-turquoise font-bold' : 'text-gray-700'
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskEdit(task)}
                      className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-all duration-200 ${getPriorityColor(task.priority)}`}
                    >
                      <div className="font-medium line-clamp-1">{task.title}</div>
                    </div>
                  ))}
                  
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayTasks.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks without due date */}
      {tasks.filter(task => !task.dueDate).length > 0 && (
        <div className="modern-card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Tarefas sem prazo
          </h3>
          <div className="grid gap-2">
            {tasks
              .filter(task => !task.dueDate)
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskEdit(task)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority).replace('bg-', 'badge-').replace('-100', '').replace(' border-', '').replace(' text-', '').replace('-200', '').replace('-700', '')}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
