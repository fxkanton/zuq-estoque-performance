
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OrphanedRecordBadgeProps {
  isOrphaned: boolean;
  createdBy: string | null;
  creatorName?: string;
  onAdopt?: () => void;
  recordType?: string;
}

const OrphanedRecordBadge = ({ 
  isOrphaned, 
  createdBy, 
  creatorName, 
  onAdopt,
  recordType = 'registro'
}: OrphanedRecordBadgeProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleAdopt = () => {
    if (onAdopt) {
      onAdopt();
      toast({
        title: 'Registro adotado!',
        description: `Você agora é responsável por este ${recordType}.`,
      });
    }
  };

  if (isOrphaned) {
    return (
      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-700 flex-1">
          Registro órfão (sem responsável)
        </span>
        {profile?.role === 'membro' && onAdopt && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdopt}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Adotar
          </Button>
        )}
      </div>
    );
  }

  if (creatorName) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <UserPlus className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-700">
          Criado por: <strong>{creatorName}</strong>
        </span>
      </div>
    );
  }

  return null;
};

export default OrphanedRecordBadge;
