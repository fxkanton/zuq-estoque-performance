
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportModal } from './ReportModal';

export const ReportButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-zuq-blue hover:bg-zuq-blue/90 text-white"
      >
        <FileText className="h-4 w-4 mr-2" />
        Gerar Relatório HTML
      </Button>
      
      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
