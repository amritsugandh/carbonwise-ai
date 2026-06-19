import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-carbon-950 bg-grid flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900/40 to-carbon-900/80 relative overflow-hidden items-center justify-center p-12">
        {/* Animated background circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <div className="text-8xl mb-6 animate-float">🌿</div>
          <h1 className="text-5xl font-black mb-4">
            <span className="gradient-text">CarbonWise</span>
            <span className="text-white"> AI</span>
          </h1>
          <p className="text-xl text-carbon-300 font-medium mb-8">
            Track Today. Predict Tomorrow. Reduce Forever.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {[
              { icon: '📊', label: 'Carbon Tracking' },
              { icon: '🤖', label: 'AI Predictions' },
              { icon: '🎯', label: 'Goal Setting' },
              { icon: '🏆', label: 'Eco Challenges' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-3 flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-carbon-300 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <span className="text-4xl">🌿</span>
            <h1 className="text-2xl font-black mt-2">
              <span className="gradient-text">CarbonWise</span>
              <span className="text-white"> AI</span>
            </h1>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
