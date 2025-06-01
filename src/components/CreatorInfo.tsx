
import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';

interface CreatorInfoProps {
  createdBy?: string;
  createdAt?: string;
  creatorName?: string;
}

const CreatorInfo = ({ createdBy, createdAt, creatorName }: CreatorInfoProps) => {
  if (!createdBy && !createdAt) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const dateTime = createdAt ? formatDateTime(createdAt) : null;

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Informações de Criação</h4>
      <div className="space-y-2 text-sm text-gray-600">
        {(createdBy || creatorName) && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>
              Criado por: <strong>{creatorName || 'Usuário Desconhecido'}</strong>
            </span>
          </div>
        )}
        {dateTime && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Data: <strong>{dateTime.date}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Horário: <strong>{dateTime.time}</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreatorInfo;
