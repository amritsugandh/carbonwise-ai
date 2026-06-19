import React from 'react';
import { cn } from '../../utils/helpers';

const Badge = ({ children, variant = 'default', size = 'sm', className }) => {
  const variants = {
    default: 'bg-carbon-700 text-carbon-300',
    primary: 'bg-primary-600/20 text-primary-400 border border-primary-600/30',
    success: 'bg-green-600/20 text-green-400 border border-green-600/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
    danger: 'bg-red-600/20 text-red-400 border border-red-600/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    purple: 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
  };
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-semibold', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export default Badge;
