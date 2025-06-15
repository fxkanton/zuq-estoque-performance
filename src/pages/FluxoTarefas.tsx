import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, List, LayoutGrid, Loader2 } from 'lucide-react';
import { KanbanView } from '@/components/tasks/KanbanView';
import { ListView } from '@/components/tasks/ListView';
import { CalendarView } from '@/components/tasks/CalendarView';
import { TaskModal } from '@/components/tasks/TaskModal';
import TaskFilters from '@/components/tasks/TaskFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  checklist: { id: string; text: string; completed: boolean }[];
  links: string[];
  createdAt: Date;
  createdBy: string;
  completedAt: Date | null;
}

const FluxoTarefas = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedPriority, setSelectedPriority] = useState('todas');
  const [selectedAssignee, setSelectedAssignee] = useState('todos');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles(full_name)');
      
      if (error) {
        toast({ title: "Erro ao buscar tarefas", description: error.message, variant: "destructive" });
        throw new Error(error.message);
      }
      
      return data.map((task: any) => ({
        ...task,
        dueDate: task.due_date ? new Date(task.due_date) : null,
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : null,
        createdBy: task.profiles?.full_name || 'Usuário Desconhecido',
        attachments: 0,
      }));
    }
  });

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

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { dueDate, ...rest } = taskData;
      const { data, error } = await supabase.from('tasks').insert({
        ...rest,
        due_date: dueDate ? dueDate.toISOString() : null,
        created_by: profile?.id,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Tarefa criada com sucesso!" });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { id, dueDate, ...rest } = taskData;
      const { data, error } = await supabase.from('tasks').update({
        ...rest,
        due_date: dueDate ? dueDate.toISOString() : null,
        completed_at: taskData.status === 'Concluídos' ? new Date().toISOString() : null,
      }).eq('id', id!);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Tarefa atualizada com sucesso!" });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar tarefa", description: error.message, variant: "destructive" });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Tarefa excluída com sucesso!" });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir tarefa", description: error.message, variant: "destructive" });
    }
  });

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
      updateTaskMutation.mutate({ ...selectedTask, ...taskData });
    } else {
      createTaskMutation.mutate({
        title: taskData.title || '',
        description: taskData.description || '',
        category: taskData.category || 'Desenvolvimento',
        priority: taskData.priority || 'Média',
        assignee: taskData.assignee || '',
        dueDate: taskData.dueDate || null,
        status: taskData.status || 'Sem prazo',
        checklist: [],
        links: [],
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
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
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-4">
            <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Fluxo de Tarefas</h1>
            
            <div className="flex justify-start">
              <Button 
                onClick={handleCreateTask}
                className="bg-zuq-blue hover:bg-zuq-blue/90 text-white flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </div>
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
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-zuq-blue" />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>

          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            task={selectedTask}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default FluxoTarefas;
