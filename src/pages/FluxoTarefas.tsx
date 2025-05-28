
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanView } from "@/components/tasks/KanbanView";
import { ListView } from "@/components/tasks/ListView";
import { CalendarView } from "@/components/tasks/CalendarView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Plus, Kanban, List, Calendar } from "lucide-react";

export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'alta' | 'media' | 'baixa';
  category: string;
  status: 'vencidos' | 'vence-hoje' | 'esta-semana' | 'proxima-semana' | 'sem-prazo' | 'concluidos';
  assignees: string[];
  attachments?: number;
  comments?: number;
  checklist?: { completed: number; total: number };
};

const FluxoTarefas = () => {
  const [activeView, setActiveView] = useState("kanban");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    assignee: "",
    priority: ""
  });

  // Mock data - replace with real data later
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Revisar equipamentos lote Q2-2024",
      description: "Verificar qualidade dos equipamentos recebidos no segundo trimestre",
      dueDate: new Date(),
      priority: "alta",
      category: "Qualidade",
      status: "vence-hoje",
      assignees: ["João Silva", "Maria Santos"],
      attachments: 3,
      comments: 2
    },
    {
      id: "2",
      title: "Atualizar cadastro de fornecedores",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: "media",
      category: "Administração",
      status: "esta-semana",
      assignees: ["Carlos Oliveira"],
      attachments: 1
    },
    {
      id: "3",
      title: "Manutenção preventiva leitoras",
      description: "Realizar manutenção preventiva em todas as leitoras do setor A",
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      priority: "alta",
      category: "Manutenção",
      status: "vencidos",
      assignees: ["Ana Costa"],
      comments: 5
    }
  ]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (selectedTask) {
      // Update existing task
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id ? { ...t, ...taskData } : t
      ));
    } else {
      // Create new task
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || "",
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority || "media",
        category: taskData.category || "Geral",
        status: taskData.status || "sem-prazo",
        assignees: taskData.assignees || [],
        attachments: 0,
        comments: 0
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && task.category !== filters.category) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    if (filters.assignee && !task.assignees.includes(filters.assignee)) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout title="Fluxo de Tarefas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleCreateTask}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filters */}
        <TaskFilters filters={filters} onFiltersChange={setFilters} />

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/50 backdrop-blur-sm rounded-lg">
            <TabsTrigger 
              value="kanban" 
              className="flex items-center gap-2 data-[state=active]:bg-zuq-turquoise data-[state=active]:text-white"
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger 
              value="lista" 
              className="flex items-center gap-2 data-[state=active]:bg-zuq-turquoise data-[state=active]:text-white"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendario" 
              className="flex items-center gap-2 data-[state=active]:bg-zuq-turquoise data-[state=active]:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="animate-fade-in">
            <KanbanView 
              tasks={filteredTasks} 
              onTaskEdit={handleEditTask}
              onTaskUpdate={setTasks}
            />
          </TabsContent>

          <TabsContent value="lista" className="animate-fade-in">
            <ListView 
              tasks={filteredTasks} 
              onTaskEdit={handleEditTask}
            />
          </TabsContent>

          <TabsContent value="calendario" className="animate-fade-in">
            <CalendarView 
              tasks={filteredTasks} 
              onTaskEdit={handleEditTask}
            />
          </TabsContent>
        </Tabs>

        {/* Task Modal */}
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={selectedTask}
          onSave={handleSaveTask}
        />
      </div>
    </MainLayout>
  );
};

export default FluxoTarefas;
