import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const ProgressBar = ({ value = 0, max = 100, color = 'primary', showLabel = true, size = 'md', className }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  const sizeMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-carbon-800 rounded-full overflow-hidden', sizeMap[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colorMap[color])}
        />
      </div>
      {showLabel && (
        <p className="text-right text-xs text-carbon-500 mt-1">{percentage.toFixed(0)}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
