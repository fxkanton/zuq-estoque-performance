
-- Create a type for task priority
CREATE TYPE public.task_priority AS ENUM ('Baixa', 'Média', 'Alta', 'Urgente');

-- Create a type for task status
CREATE TYPE public.task_status AS ENUM ('Vencidos', 'Vence hoje', 'Esta semana', 'Próxima semana', 'Sem prazo', 'Concluídos');

-- Create the tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority public.task_priority NOT NULL DEFAULT 'Média',
  assignee TEXT,
  due_date TIMESTAMPTZ,
  status public.task_status NOT NULL DEFAULT 'Sem prazo',
  checklist JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
-- Allows authenticated users to view, create, update, and delete tasks.
CREATE POLICY "Allow authenticated users to manage tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task_attachments', 'task_attachments', false, 5242880, ARRAY['image/png', 'image/jpeg', 'application/pdf', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket
CREATE POLICY "Allow authenticated users to manage task attachments"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'task_attachments' )
WITH CHECK ( bucket_id = 'task_attachments' );
