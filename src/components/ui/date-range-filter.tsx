
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFilterApply: () => void;
}

const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onFilterApply 
}: DateRangeFilterProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="start-date" className="text-sm font-medium">Data Inicial</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                id="start-date" 
                type="date" 
                value={startDate} 
                onChange={(e) => onStartDateChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="end-date" className="text-sm font-medium">Data Final</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                id="end-date" 
                type="date" 
                value={endDate} 
                onChange={(e) => onEndDateChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button 
            onClick={onFilterApply}
            className="bg-zuq-blue hover:bg-zuq-blue/80"
          >
            <Calendar className="h-4 w-4 mr-2" /> Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
