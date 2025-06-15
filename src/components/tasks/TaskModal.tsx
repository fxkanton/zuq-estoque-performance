import { useState, useEffect } from "react";
import { Task } from "@/pages/FluxoTarefas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X, Upload, FileText, Image, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export const TaskModal = ({ isOpen, onClose, task, onSave, onDelete }: TaskModalProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
    priority: "Média" as Task['priority'],
    category: "",
    status: "Sem prazo" as Task['status'],
    assignee: ""
  });
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  // Buscar usuários membros para o dropdown de responsáveis
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['membro', 'gerente']);
      
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Buscar anexos da tarefa
  const { data: taskAttachments } = useQuery({
    queryKey: ['task-attachments', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', task.id);
      
      if (error) throw error;
      return data as TaskAttachment[];
    },
    enabled: !!task?.id
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate || undefined,
        priority: task.priority,
        category: task.category,
        status: task.status,
        assignee: task.assignee
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: undefined,
        priority: "Média",
        category: "",
        status: "Sem prazo",
        assignee: ""
      });
    }
  }, [task, isOpen]);

  useEffect(() => {
    if (taskAttachments) {
      setAttachments(taskAttachments);
    }
  }, [taskAttachments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !task?.id || !profile?.id) return;

    for (const file of Array.from(files)) {
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadingFiles(prev => [...prev, fileId]);

      try {
        // Upload para o Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName);

        // Salvar informações do anexo no banco
        const { error: dbError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: task.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: profile.id
          });

        if (dbError) throw dbError;

        // Atualizar lista de anexos
        const newAttachment: TaskAttachment = {
          id: Math.random().toString(),
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: profile.id,
          created_at: new Date().toISOString()
        };
        
        setAttachments(prev => [...prev, newAttachment]);

        toast({
          title: "Arquivo enviado!",
          description: `${file.name} foi anexado com sucesso.`,
        });

      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast({
          title: "Erro no upload",
          description: `Não foi possível enviar ${file.name}.`,
          variant: "destructive",
        });
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== fileId));
      }
    }

    // Limpar input
    event.target.value = '';
  };

  const handleRemoveAttachment = async (attachment: TaskAttachment) => {
    try {
      // Remover do Storage
      const fileName = attachment.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('task-attachments')
          .remove([fileName]);
      }

      // Remover do banco
      await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      // Atualizar lista local
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));

      toast({
        title: "Arquivo removido",
        description: `${attachment.file_name} foi removido.`,
      });

    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSave(formData);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da tarefa..."
              className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Adicione uma descrição detalhada..."
              rows={4}
              className="border-gray-200 focus:border-zuq-turquoise focus:ring-zuq-turquoise/20"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Vencimento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-gray-200 hover:border-zuq-turquoise"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP", { locale: ptBR })
                  ) : (
                    <span className="text-gray-500">Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prioridade</label>
              <Select value={formData.priority} onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Administração">Administração</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={(value: Task['status']) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vencidos">Vencidos</SelectItem>
                <SelectItem value="Vence hoje">Vence hoje</SelectItem>
                <SelectItem value="Esta semana">Esta semana</SelectItem>
                <SelectItem value="Próxima semana">Próxima semana</SelectItem>
                <SelectItem value="Sem prazo">Sem prazo</SelectItem>
                <SelectItem value="Concluídos">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Responsável</label>
            <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
              <SelectTrigger className="border-gray-200 focus:border-zuq-turquoise">
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.full_name || member.id}>
                    {member.full_name || 'Usuário Sem Nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Anexos</label>
            
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={!task?.id}
                >
                  Selecionar Arquivos
                </Button>
                {!task?.id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Salve a tarefa primeiro para adicionar anexos
                  </p>
                )}
              </div>

              {/* Lista de anexos */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Arquivos anexados:</div>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        {getFileIcon(attachment.file_type)}
                        <span className="text-sm">{attachment.file_name}</span>
                        {attachment.file_size && (
                          <span className="text-xs text-gray-500">
                            ({Math.round(attachment.file_size / 1024)} KB)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          Ver
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(attachment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Indicador de upload */}
              {uploadingFiles.length > 0 && (
                <div className="mt-2 text-sm text-blue-600">
                  Enviando {uploadingFiles.length} arquivo(s)...
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <div>
              {task && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa e todos os seus dados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(task.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sim, excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary">
                <Save className="h-4 w-4 mr-2" />
                {task ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
