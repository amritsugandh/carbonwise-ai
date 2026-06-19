import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toFixed(decimals);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateShort = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
};

export const getScoreColor = (score) => {
  if (score >= 80) return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', label: 'Excellent' };
  if (score >= 60) return { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', label: 'Good' };
  if (score >= 40) return { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'Average' };
  return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Needs Improvement' };
};

export const getRiskColor = (level) => {
  const levels = {
    High: { text: 'text-red-400', bg: 'bg-red-400/10', icon: '🔴' },
    Moderate: { text: 'text-orange-400', bg: 'bg-orange-400/10', icon: '🟠' },
    Low: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: '🟡' },
    Minimal: { text: 'text-green-400', bg: 'bg-green-400/10', icon: '🟢' },
  };
  return levels[level] || levels.Minimal;
};

export const getTrendIcon = (direction) => {
  if (direction === 'increasing') return { icon: '↗️', text: 'text-red-400', label: 'Increasing' };
  if (direction === 'decreasing') return { icon: '↘️', text: 'text-green-400', label: 'Decreasing' };
  return { icon: '➡️', text: 'text-yellow-400', label: 'Stable' };
};

export const getCategoryIcon = (category) => {
  const icons = {
    transport: '🚗',
    electricity: '⚡',
    food: '🍽️',
    lifestyle: '🛍️',
    nature: '🌳',
    energy: '💡',
    overall: '🌍',
  };
  return icons[category] || '📊';
};

export const getCategoryColor = (category) => {
  const colors = {
    transport: '#f97316',
    electricity: '#eab308',
    food: '#22c55e',
    lifestyle: '#a855f7',
    nature: '#06b6d4',
    energy: '#3b82f6',
  };
  return colors[category] || '#64748b';
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    hard: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  };
  return colors[difficulty] || colors.easy;
};

export const calculateProgress = (current, target) => {
  if (!current || !target) return 0;
  const reduction = ((current - target) / current) * 100;
  return Math.min(100, Math.max(0, Math.round(reduction)));
};

export const truncate = (str, length = 80) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const EMISSION_CATEGORIES = [
  { key: 'transportEmission', label: 'Transport', icon: '🚗', color: '#f97316' },
  { key: 'electricityEmission', label: 'Electricity', icon: '⚡', color: '#eab308' },
  { key: 'foodEmission', label: 'Food', icon: '🍽️', color: '#22c55e' },
  { key: 'lifestyleEmission', label: 'Lifestyle', icon: '🛍️', color: '#a855f7' },
];
