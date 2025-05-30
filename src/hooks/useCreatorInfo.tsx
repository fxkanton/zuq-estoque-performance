
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorInfo {
  id: string;
  name: string;
  isOrphaned: boolean;
}

export const useCreatorInfo = (createdBy: string | null) => {
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!createdBy) {
        setCreatorInfo({
          id: '',
          name: '',
          isOrphaned: true
        });
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase.rpc('get_creator_name', {
          creator_id: createdBy
        });

        setCreatorInfo({
          id: createdBy,
          name: data || 'Usuário Desconhecido',
          isOrphaned: false
        });
      } catch (error) {
        console.error('Error fetching creator info:', error);
        setCreatorInfo({
          id: createdBy,
          name: 'Erro ao carregar',
          isOrphaned: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorInfo();
  }, [createdBy]);

  return { creatorInfo, loading };
};
