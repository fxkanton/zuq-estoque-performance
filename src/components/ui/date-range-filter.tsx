
import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const handlePresetChange = (value: string) => {
    if (!onChange) return;
    
    const now = new Date();
    
    switch (value) {
      case "today":
        onChange(now, now);
        break;
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        onChange(yesterday, yesterday);
        break;
      }
      case "last7days": {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        onChange(last7Days, now);
        break;
      }
      case "last30days": {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 29);
        onChange(last30Days, now);
        break;
      }
      case "thisMonth":
        onChange(startOfMonth(now), endOfMonth(now));
        break;
      case "lastMonth": {
        const lastMonth = subMonths(now, 1);
        onChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[160px] md:w-[200px] justify-start text-left font-normal text-xs md:text-sm"
            >
              <CalendarIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">
                {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                if (date && onChange) {
                  onChange(date, endDate < date ? date : endDate);
                  setIsStartCalendarOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <span className="text-sm text-gray-500 self-center">até</span>
        
        <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[160px] md:w-[200px] justify-start text-left font-normal text-xs md:text-sm"
            >
              <CalendarIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">
                {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                if (date && onChange) {
                  onChange(startDate > date ? date : startDate, date);
                  setIsEndCalendarOpen(false);
                }
              }}
              initialFocus
              fromDate={startDate}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[160px] md:w-[200px] text-xs md:text-sm">
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="last7days">Últimos 7 dias</SelectItem>
          <SelectItem value="last30days">Últimos 30 dias</SelectItem>
          <SelectItem value="thisMonth">Este mês</SelectItem>
          <SelectItem value="lastMonth">Mês passado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
