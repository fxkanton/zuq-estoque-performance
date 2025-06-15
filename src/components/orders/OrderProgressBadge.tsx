
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface OrderProgressBadgeProps {
  totalQuantity: number;
  receivedQuantity: number;
  className?: string;
}

const OrderProgressBadge = ({ totalQuantity, receivedQuantity, className }: OrderProgressBadgeProps) => {
  const progress = totalQuantity > 0 ? (receivedQuantity / totalQuantity) * 100 : 0;
  const isComplete = receivedQuantity >= totalQuantity;
  const isPartial = receivedQuantity > 0 && receivedQuantity < totalQuantity;

  const getBadgeStyle = () => {
    if (isComplete) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (isPartial) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <Badge variant="outline" className={getBadgeStyle()}>
        {receivedQuantity}/{totalQuantity}
      </Badge>
      <Progress value={progress} className="h-1 w-16" />
    </div>
  );
};

export default OrderProgressBadge;
