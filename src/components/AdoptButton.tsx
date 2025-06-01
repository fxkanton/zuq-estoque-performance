
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface AdoptButtonProps {
  isOrphaned: boolean;
  onAdopt: () => void;
  size?: 'sm' | 'icon';
  variant?: 'outline' | 'default';
  className?: string;
}

const AdoptButton = ({ 
  isOrphaned, 
  onAdopt, 
  size = 'sm', 
  variant = 'outline',
  className = ''
}: AdoptButtonProps) => {
  if (!isOrphaned) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onAdopt}
      className={`text-amber-600 border-amber-300 hover:bg-amber-50 ${className}`}
      title="Adotar registro"
    >
      <UserPlus className="h-4 w-4" />
      {size !== 'icon' && <span className="ml-1">Adotar</span>}
    </Button>
  );
};

export default AdoptButton;
