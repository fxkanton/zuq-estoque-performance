
-- Criar tabela para histórico de importações
CREATE TABLE public.import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data_type TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar RLS na tabela import_history
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias importações
CREATE POLICY "Users can view their own import history" 
  ON public.import_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias importações
CREATE POLICY "Users can create their own import history" 
  ON public.import_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias importações
CREATE POLICY "Users can update their own import history" 
  ON public.import_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar índice para melhor performance
CREATE INDEX idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX idx_import_history_data_type ON public.import_history(data_type);
CREATE INDEX idx_import_history_status ON public.import_history(status);
