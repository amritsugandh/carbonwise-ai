import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { carbonAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';
import ScoreGauge from '../components/ui/ScoreGauge';
import EmissionBreakdown from '../components/ui/EmissionBreakdown';
import { formatNumber, formatDateShort } from '../utils/helpers';

const Dashboard = () => {
  const { dbUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        carbonAPI.getStats(),
        carbonAPI.getHistory({ limit: 12 }),
      ]);
      setStats(statsRes.data.data);
      const records = historyRes.data.data;
      setHistory(records);
      if (records.length > 0) setLatestRecord(records[0]);
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build monthly chart data
  const monthlyChartData = stats?.monthly
    ?.slice()
    .reverse()
    .map((m) => ({
      name: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
      emission: parseFloat(m.avgEmission.toFixed(1)),
    })) || [];

  const quickActions = [
    { label: 'Calculate',  icon: '🧮', path: '/calculator',  color: 'from-primary-600/20 to-emerald-600/10' },
    { label: 'AI Coach',   icon: '🤖', path: '/ai-coach',    color: 'from-blue-600/20 to-cyan-600/10'       },
    { label: 'Challenges', icon: '🏆', path: '/challenges',  color: 'from-yellow-600/20 to-orange-600/10'   },
    { label: 'Predict',    icon: '🔮', path: '/predictions', color: 'from-purple-600/20 to-pink-600/10'     },
    { label: 'Compare',    icon: '🌍', path: '/compare',     color: 'from-teal-600/20 to-cyan-600/10'       },
    { label: 'Streak',     icon: '🔥', path: '/streak',      color: 'from-orange-600/20 to-red-600/10'      },
    { label: 'Eco News',   icon: '📰', path: '/eco-news',    color: 'from-green-600/20 to-emerald-600/10'   },
    { label: 'Reports',    icon: '📋', path: '/reports',     color: 'from-indigo-600/20 to-blue-600/10'     },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-primary-900/50 to-emerald-900/30 border border-primary-700/30 rounded-2xl p-6 overflow-hidden"
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20 animate-float">🌍</div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white mb-1">
            Welcome back, {dbUser?.username?.split(' ')[0] || 'Eco Warrior'}! 🌱
          </h1>
          <p className="text-carbon-400 text-sm">
            Track Today. Predict Tomorrow. Reduce Forever.
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🌍"
          label="Latest Emission"
          value={formatNumber(latestRecord?.totalEmission || 0)}
          unit="kg CO₂"
          sub="This month"
          color="primary"
        />
        <StatCard
          icon="📊"
          label="Avg Emission"
          value={formatNumber(stats?.summary?.avgTotal || 0)}
          unit="kg CO₂"
          sub="Monthly avg"
          color="blue"
        />
        <StatCard
          icon="⭐"
          label="Eco Points"
          value={dbUser?.ecoPoints || 0}
          sub="Total earned"
          color="yellow"
        />
        <StatCard
          icon="📋"
          label="Calculations"
          value={stats?.summary?.count || 0}
          sub="Total records"
          color="purple"
        />
      </div>

      {/* Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sustainability Score */}
        <div className="card flex flex-col items-center justify-center gap-4">
          <h3 className="text-lg font-bold text-white self-start">Sustainability Score</h3>
          <ScoreGauge score={dbUser?.sustainabilityScore || 0} size={160} />
          <div className="w-full bg-carbon-800 rounded-xl p-3 text-sm text-carbon-400 text-center">
            {dbUser?.sustainabilityScore >= 80
              ? '🏆 Excellent! Keep it up!'
              : dbUser?.sustainabilityScore >= 60
              ? '✅ Good progress!'
              : dbUser?.sustainabilityScore >= 40
              ? '⚠️ Room to improve'
              : '🔴 Take action now'}
          </div>
        </div>

        {/* Emission Breakdown */}
        <div className="card col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Emission Breakdown</h3>
          {latestRecord ? (
            <EmissionBreakdown data={latestRecord} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-carbon-500">
              <span className="text-4xl mb-3">🧮</span>
              <p className="text-sm">No data yet.</p>
              <Link to="/calculator" className="btn-primary mt-3 text-sm py-2">Calculate Now</Link>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyChartData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Monthly Emission Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={(v) => [`${v} kg CO₂`, 'Emission']}
              />
              <Line
                type="monotone"
                dataKey="emission"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`bg-gradient-to-br ${action.color} border border-white/10 rounded-2xl p-5 text-center cursor-pointer hover:border-white/20 transition-all`}
              >
                <span className="text-3xl block mb-2">{action.icon}</span>
                <span className="text-sm font-semibold text-white">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Records</h3>
            <Link to="/history" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {history.slice(0, 5).map((record) => (
              <div key={record._id} className="flex items-center justify-between p-3 bg-carbon-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-600/20 rounded-xl flex items-center justify-center text-lg">🌍</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{formatNumber(record.totalEmission)} kg CO₂</p>
                    <p className="text-xs text-carbon-500">{formatDateShort(record.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-carbon-400">Score: <span className="text-primary-400 font-bold">{record.sustainabilityScore}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
