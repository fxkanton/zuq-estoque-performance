
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
  // Parse the ISO string dates to Date objects for the calendar component
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  // Format date for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "Selecione uma data";
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Handle date selection
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      onStartDateChange(date.toISOString().split('T')[0]);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onEndDateChange(date.toISOString().split('T')[0]);
    }
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="start-date" className="text-sm font-medium">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal pl-3 bg-white border-gray-300 hover:bg-gray-50",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {formatDateForDisplay(startDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDateObj}
                  onSelect={handleStartDateChange}
                  initialFocus
                  className="bg-white rounded-md shadow p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="end-date" className="text-sm font-medium">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal pl-3 bg-white border-gray-300 hover:bg-gray-50",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {formatDateForDisplay(endDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDateObj}
                  onSelect={handleEndDateChange}
                  initialFocus
                  className="bg-white rounded-md shadow p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            onClick={onFilterApply}
            className="bg-zuq-blue hover:bg-zuq-blue/80 px-6"
          >
            <Calendar className="h-4 w-4 mr-2" /> Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
