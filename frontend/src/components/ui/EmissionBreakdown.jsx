import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EMISSION_CATEGORIES, formatNumber } from '../../utils/helpers';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-carbon-800 border border-carbon-700 rounded-xl p-3 text-sm">
        <p className="font-semibold text-white">{payload[0].name}</p>
        <p className="text-carbon-300">{formatNumber(payload[0].value)} kg CO₂</p>
        <p className="text-primary-400">{payload[0].payload.percent?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const EmissionBreakdown = ({ data }) => {
  if (!data) return null;

  const total = data.totalEmission || 1;
  const chartData = EMISSION_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: parseFloat((data[cat.key] || 0).toFixed(2)),
    color: cat.color,
    icon: cat.icon,
    percent: ((data[cat.key] || 0) / total) * 100,
  })).filter((d) => d.value > 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-carbon-400">{item.icon} {item.name}</span>
            <span className="text-xs text-white font-medium ml-auto">{formatNumber(item.value)}kg</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmissionBreakdown;
