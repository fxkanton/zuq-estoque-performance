
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'intruso' | 'membro' | 'gerente';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<{ [key: string]: Profile }>({});
  const { toast } = useToast();

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    // Check cache first to avoid unnecessary requests
    if (profileCache[user.id]) {
      setProfile(profileCache[user.id]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(data);
        // Cache the profile for 5 minutes
        setProfileCache(prev => ({ ...prev, [user.id]: data }));
        setTimeout(() => {
          setProfileCache(prev => {
            const newCache = { ...prev };
            delete newCache[user.id];
            return newCache;
          });
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro no login',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta.',
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar a conta.',
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      setProfile(null);
      setProfileCache({});
      
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: 'Erro na recuperação',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada.',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Erro na atualização',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Clear cache to force refresh
      setProfileCache(prev => {
        const newCache = { ...prev };
        delete newCache[user.id];
        return newCache;
      });

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          
          // Clear profile cache when user changes
          if (event === 'SIGNED_OUT') {
            setProfile(null);
            setProfileCache({});
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Only refresh profile when user changes and we have a user
  useEffect(() => {
    if (user?.id && !loading) {
      refreshProfile();
    }
  }, [user?.id, loading]);

  const value = {
    user,
    profile,
    loading,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
