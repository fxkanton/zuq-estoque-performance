
import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, List, LayoutGrid } from 'lucide-react';
import { KanbanView } from '@/components/tasks/KanbanView';
import { ListView } from '@/components/tasks/ListView';
import { CalendarView } from '@/components/tasks/CalendarView';
import { TaskModal } from '@/components/tasks/TaskModal';
import TaskFilters from '@/components/tasks/TaskFilters';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  assignee: string;
  dueDate: Date | null;
  status: 'Vencidos' | 'Vence hoje' | 'Esta semana' | 'Próxima semana' | 'Sem prazo' | 'Concluídos';
  attachments: number;
  comments: number;
  checklist: { id: string; text: string; completed: boolean }[];
  links: string[];
  createdAt: Date;
  completedAt: Date | null;
}

const FluxoTarefas = () => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedPriority, setSelectedPriority] = useState('todas');
  const [selectedAssignee, setSelectedAssignee] = useState('todos');

  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Implementar sistema de autenticação',
      description: 'Desenvolver sistema completo de login e registro de usuários',
      category: 'Desenvolvimento',
      priority: 'Alta',
      assignee: 'João Silva',
      dueDate: new Date(2025, 4, 25), // May 25, 2025
      status: 'Vence hoje',
      attachments: 2,
      comments: 5,
      checklist: [
        { id: '1', text: 'Criar endpoints de API', completed: true },
        { id: '2', text: 'Implementar validação', completed: false }
      ],
      links: ['https://github.com/projeto'],
      createdAt: new Date(2025, 4, 20),
      completedAt: null
    },
    {
      id: '2',
      title: 'Design da página inicial',
      description: 'Criar mockups e protótipos da página principal',
      category: 'Qualidade',
      priority: 'Média',
      assignee: 'Maria Santos',
      dueDate: new Date(2025, 4, 30),
      status: 'Esta semana',
      attachments: 1,
      comments: 3,
      checklist: [],
      links: [],
      createdAt: new Date(2025, 4, 22),
      completedAt: null
    }
  ]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'todas' || task.category === selectedCategory;
      const matchesPriority = selectedPriority === 'todas' || task.priority === selectedPriority;
      const matchesAssignee = selectedAssignee === 'todos' || task.assignee === selectedAssignee;

      return matchesSearch && matchesCategory && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchTerm, selectedCategory, selectedPriority, selectedAssignee]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (selectedTask) {
      // Edit existing task
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, ...taskData }
          : task
      ));
    } else {
      // Create new task
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: taskData.title || '',
        description: taskData.description || '',
        category: taskData.category || 'Desenvolvimento',
        priority: taskData.priority || 'Média',
        assignee: taskData.assignee || 'João Silva',
        dueDate: taskData.dueDate || null,
        status: taskData.status || 'Sem prazo',
        attachments: 0,
        comments: 0,
        checklist: [],
        links: [],
        createdAt: new Date(),
        completedAt: null
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            completedAt: newStatus === 'Concluídos' ? new Date() : null
          }
        : task
    ));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedPriority('todas');
    setSelectedAssignee('todos');
  };

  return (
    <MainLayout title="Fluxo de Tarefas">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Fluxo de Tarefas</h1>
          <Button 
            onClick={handleCreateTask}
            className="bg-zuq-blue hover:bg-zuq-blue/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedAssignee={selectedAssignee}
          onAssigneeChange={setSelectedAssignee}
          onClearFilters={clearFilters}
        />

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban" className="space-y-4">
                <KanbanView 
                  tasks={filteredTasks}
                  onTaskEdit={handleEditTask}
                  onMoveTask={handleMoveTask}
                />
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <ListView 
                  tasks={filteredTasks}
                  onTaskEdit={handleEditTask}
                />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <CalendarView 
                  tasks={filteredTasks}
                  onTaskEdit={handleEditTask}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          onSave={handleSaveTask}
        />
      </div>
    </MainLayout>
  );
};

export default FluxoTarefas;
