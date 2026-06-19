import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

const navItems = [
  { path: '/dashboard',   icon: '📊', label: 'Dashboard'   },
  { path: '/calculator',  icon: '🧮', label: 'Calculator'  },
  { path: '/history',     icon: '📈', label: 'History'     },
  { path: '/predictions', icon: '🔮', label: 'Predictions' },
  { path: '/compare',     icon: '🌍', label: 'Compare'     },
  { path: '/goals',       icon: '🎯', label: 'Goals'       },
  { path: '/challenges',  icon: '🏆', label: 'Challenges'  },
  { path: '/streak',      icon: '🔥', label: 'Streak'      },
  { path: '/eco-news',    icon: '📰', label: 'Eco News'    },
  { path: '/ai-coach',    icon: '🤖', label: 'AI Coach'    },
  { path: '/leaderboard', icon: '🥇', label: 'Leaderboard' },
  { path: '/reports',     icon: '📋', label: 'Reports'     },
  { path: '/profile',     icon: '👤', label: 'Profile'     },
];

const Sidebar = ({ mobile, onClose }) => {
  const { dbUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={mobile ? { x: -280 } : false}
      animate={{ x: 0 }}
      className={cn(
        'w-64 h-full bg-carbon-900/95 border-r border-carbon-800 flex flex-col',
        mobile && 'fixed left-0 top-0 z-50'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-carbon-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="font-black text-lg leading-none">
              <span className="gradient-text">CarbonWise</span>
            </h1>
            <p className="text-xs text-carbon-500 mt-0.5">AI Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {dbUser && (
        <div className="p-4 border-b border-carbon-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600/20 border border-primary-600/30 flex items-center justify-center overflow-hidden">
              {dbUser.avatar ? (
                <img src={dbUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary-400">
                  {(dbUser.username || dbUser.email)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {dbUser.username || 'User'}
              </p>
              <p className="text-xs text-carbon-500 truncate">{dbUser.email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-carbon-800 rounded-lg p-2 text-center">
              <p className="text-xs text-carbon-500">Eco Points</p>
              <p className="text-sm font-bold text-primary-400">{dbUser.ecoPoints || 0}</p>
            </div>
            <div className="flex-1 bg-carbon-800 rounded-lg p-2 text-center">
              <p className="text-xs text-carbon-500">Score</p>
              <p className="text-sm font-bold text-emerald-400">{dbUser.sustainabilityScore || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'active')
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-carbon-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-carbon-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 font-medium"
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
