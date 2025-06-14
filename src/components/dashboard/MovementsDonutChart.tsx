
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { RefreshCw } from "lucide-react";

interface MovementsDonutChartProps {
  entries: number;
  exits: number;
}

export const MovementsDonutChart = ({ entries, exits }: MovementsDonutChartProps) => {
  const data = [
    { 
      name: 'Entradas', 
      value: entries, 
      color: '#10b981',
      gradient: 'url(#entriesGradient)',
      percentage: entries + exits > 0 ? ((entries / (entries + exits)) * 100).toFixed(1) : '0'
    },
    { 
      name: 'Saídas', 
      value: exits, 
      color: '#f59e0b',
      gradient: 'url(#exitsGradient)',
      percentage: entries + exits > 0 ? ((exits / (entries + exits)) * 100).toFixed(1) : '0'
    }
  ];

  const total = entries + exits;

  const renderCustomizedLabel = ({ cx, cy }: { cx: number; cy: number }) => {
    return (
      <g>
        {/* Main total number */}
        <text 
          x={cx} 
          y={cy - 8} 
          fill="#1e293b" 
          textAnchor="middle"
          dominantBaseline="central"
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {total.toLocaleString()}
        </text>
        {/* Subtitle */}
        <text 
          x={cx} 
          y={cy + 16} 
          fill="#64748b" 
          textAnchor="middle"
          dominantBaseline="central"
          className="text-xs md:text-sm font-medium"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Total de Movimentações
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="font-semibold text-gray-800">{data.payload.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">Quantidade:</span>
              <span className="font-bold text-lg">{data.value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">Percentual:</span>
              <span className="font-semibold text-base text-blue-600">{data.payload.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-8 mt-6 px-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-col items-center bg-white/80 rounded-xl px-4 py-3 shadow-sm border border-gray-100/50 min-w-[120px]">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-semibold text-gray-800">{entry.value}</span>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-gray-800">
                {data[index]?.value.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-500">
                {data[index]?.percentage}% do total
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 border-0 shadow-xl">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-purple-50/30 border-b border-gray-100/50">
        <CardTitle className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-[#00B3DA] to-[#0099BB] rounded-xl shadow-lg">
            <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div>
            <div className="text-slate-800">Movimentações do Período</div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">Análise de Fluxo</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)] p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="entriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="exitsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.15"/>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="70%"
              innerRadius="45%"
              fill="#8884d8"
              dataKey="value"
              strokeWidth={0}
              style={{ filter: 'url(#shadow)' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.gradient}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
