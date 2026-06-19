import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/helpers';

const ScoreGauge = ({ score = 0, size = 160 }) => {
  const scoreInfo = getScoreColor(score);
  const radius = size / 2 - 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorMap = {
    'text-green-400': '#4ade80',
    'text-blue-400': '#60a5fa',
    'text-yellow-400': '#facc15',
    'text-red-400': '#f87171',
  };
  const strokeColor = colorMap[scoreInfo.text] || '#4ade80';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-3xl font-black ${scoreInfo.text}`}
          >
            {score}
          </motion.span>
          <span className="text-xs text-carbon-500">/ 100</span>
        </div>
      </div>
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${scoreInfo.bg} ${scoreInfo.text} border ${scoreInfo.border}`}>
        {scoreInfo.label}
      </div>
    </div>
  );
};

export default ScoreGauge;
