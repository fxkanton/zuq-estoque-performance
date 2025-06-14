
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MovementsDonutChartProps {
  entries: number;
  exits: number;
}

export const MovementsDonutChart = ({ entries, exits }: MovementsDonutChartProps) => {
  const data = [
    { name: 'Entradas', value: entries, color: '#4ade80' },
    { name: 'Saídas', value: exits, color: '#f59e0b' }
  ];

  const total = entries + exits;

  const renderCustomizedLabel = ({ cx, cy }: { cx: number; cy: number }) => {
    return (
      <text 
        x={cx} 
        y={cy} 
        fill="#374151" 
        textAnchor={cx > 200 ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-2xl md:text-3xl font-bold"
      >
        {total}
      </text>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg font-medium text-zuq-darkblue flex items-center gap-2">
          <ArrowDown className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
          Movimentações do Período
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] p-2 md:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="70%"
              innerRadius="40%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, '']}
              labelFormatter={(label) => label}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs md:text-sm font-medium">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
