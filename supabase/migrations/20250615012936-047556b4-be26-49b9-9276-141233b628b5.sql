
-- Criar política para permitir que gerentes atualizem qualquer perfil
CREATE POLICY "Managers can update any profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (public.is_manager(auth.uid()));

-- Criar política para permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
