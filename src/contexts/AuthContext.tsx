
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
