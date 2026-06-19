import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard':   { title: 'Dashboard',         icon: '📊' },
  '/calculator':  { title: 'Carbon Calculator', icon: '🧮' },
  '/history':     { title: 'Carbon History',    icon: '📈' },
  '/predictions': { title: 'AI Predictions',    icon: '🔮' },
  '/compare':     { title: 'Carbon Compare',    icon: '🌍' },
  '/goals':       { title: 'Reduction Goals',   icon: '🎯' },
  '/challenges':  { title: 'Eco Challenges',    icon: '🏆' },
  '/streak':      { title: 'Activity Streak',   icon: '🔥' },
  '/eco-news':    { title: 'Eco News & Tips',   icon: '📰' },
  '/ai-coach':    { title: 'AI Carbon Coach',   icon: '🤖' },
  '/leaderboard': { title: 'Leaderboard',       icon: '🥇' },
  '/reports':     { title: 'Reports',           icon: '📋' },
  '/profile':     { title: 'Profile',           icon: '👤' },
};

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const { dbUser } = useAuth();
  const page = pageTitles[location.pathname] || { title: 'CarbonWise AI', icon: '🌿' };

  return (
    <header className="h-16 bg-carbon-900/80 backdrop-blur-md border-b border-carbon-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-carbon-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xl">{page.icon}</span>
        <h2 className="text-lg font-bold text-white">{page.title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Score badge */}
        {dbUser && (
          <div className="hidden sm:flex items-center gap-2 bg-primary-600/10 border border-primary-600/20 rounded-xl px-3 py-1.5">
            <span className="text-sm">🌱</span>
            <span className="text-sm font-semibold text-primary-400">{dbUser.sustainabilityScore || 0}</span>
            <span className="text-xs text-carbon-500">Score</span>
          </div>
        )}
        {/* Eco points */}
        {dbUser && (
          <div className="hidden sm:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-semibold text-yellow-400">{dbUser.ecoPoints || 0}</span>
            <span className="text-xs text-carbon-500">pts</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
