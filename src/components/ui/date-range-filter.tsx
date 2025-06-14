
import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 p-4 md:p-6">
        <CardTitle className="text-base md:text-lg font-semibold text-zuq-darkblue flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <Filter className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
          </div>
          Filtrar Período
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[140px] md:w-[180px] justify-start text-left font-normal text-xs md:text-sm h-9"
                >
                  <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
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

            <span className="text-sm text-gray-500 hidden sm:block">até</span>

            <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[140px] md:w-[180px] justify-start text-left font-normal text-xs md:text-sm h-9"
                >
                  <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
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
            <SelectTrigger className="w-full lg:w-[220px] text-xs md:text-sm h-9">
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
      </CardContent>
    </Card>
  );
}
