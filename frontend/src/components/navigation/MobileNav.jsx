import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/helpers';

const mobileNavItems = [
  { path: '/dashboard', icon: '📊', label: 'Home' },
  { path: '/calculator', icon: '🧮', label: 'Calculate' },
  { path: '/predictions', icon: '🔮', label: 'Predict' },
  { path: '/challenges', icon: '🏆', label: 'Challenges' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const MobileNav = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-carbon-900/95 backdrop-blur-md border-t border-carbon-800">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary-400 bg-primary-600/10'
                  : 'text-carbon-500 hover:text-carbon-300'
              )
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
