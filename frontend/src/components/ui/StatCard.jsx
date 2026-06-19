import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const StatCard = ({ icon, label, value, unit, sub, color = 'primary', trend, className }) => {
  const colorMap = {
    primary: 'from-primary-600/20 to-emerald-600/10 border-primary-600/20',
    orange: 'from-orange-600/20 to-red-600/10 border-orange-600/20',
    yellow: 'from-yellow-600/20 to-amber-600/10 border-yellow-600/20',
    blue: 'from-blue-600/20 to-cyan-600/10 border-blue-600/20',
    purple: 'from-purple-600/20 to-pink-600/10 border-purple-600/20',
    red: 'from-red-600/20 to-rose-600/10 border-red-600/20',
  };

  const iconBgMap = {
    primary: 'bg-primary-500/20 text-primary-400',
    orange: 'bg-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-gradient-to-br border rounded-2xl p-5 overflow-hidden',
        colorMap[color],
        className
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl', iconBgMap[color])}>
            {icon}
          </div>
          {trend && (
            <span className={cn('text-xs font-semibold px-2 py-1 rounded-full',
              trend > 0 ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'
            )}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-sm text-carbon-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white">{value}</span>
          {unit && <span className="text-sm text-carbon-500">{unit}</span>}
        </div>
        {sub && <p className="text-xs text-carbon-500 mt-1">{sub}</p>}
      </div>
      {/* Decorative circle */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
    </motion.div>
  );
};

export default StatCard;
