import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { carbonAPI } from '../services/api';
import Spinner from '../components/ui/Spinner';

// Build last 70 days of activity
const buildHeatmap = (records) => {
  const map = {};
  records.forEach(r => {
    const d = new Date(r.createdAt).toDateString();
    map[d] = (map[d] || 0) + 1;
  });

  const days = [];
  const today = new Date();
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    days.push({ date: d, count: map[key] || 0, key });
  }
  return days;
};

const getColor = (count) => {
  if (count === 0) return 'bg-carbon-800';
  if (count === 1) return 'bg-primary-900';
  if (count === 2) return 'bg-primary-700';
  return 'bg-primary-500';
};

const DAILY_TIPS = [
  { icon: '🚶', tip: 'Walk or cycle for trips under 2 km today', category: 'transport' },
  { icon: '💡', tip: 'Turn off all lights when leaving a room today', category: 'electricity' },
  { icon: '🥗', tip: 'Try a plant-based meal today', category: 'food' },
  { icon: '🛍️', tip: 'Say no to single-use plastic today', category: 'lifestyle' },
  { icon: '🚌', tip: 'Use public transport instead of a car today', category: 'transport' },
  { icon: '🔌', tip: 'Unplug all chargers not in use today', category: 'electricity' },
  { icon: '🍱', tip: 'Reduce food waste — plan your meals today', category: 'food' },
  { icon: '♻️', tip: 'Sort your waste properly and recycle today', category: 'lifestyle' },
  { icon: '🌿', tip: 'Plant something green today — even a herb', category: 'nature' },
  { icon: '🚿', tip: 'Take a shorter shower to save water & energy', category: 'electricity' },
  { icon: '🌳', tip: 'Offset your emissions — donate to a reforestation project', category: 'nature' },
  { icon: '🥤', tip: 'Use a reusable water bottle all day today', category: 'lifestyle' },
  { icon: '🏠', tip: 'Work from home if possible — skip the commute', category: 'transport' },
  { icon: '🌞', tip: 'Air-dry your clothes instead of using a dryer', category: 'electricity' },
  { icon: '🛒', tip: 'Buy local produce — reduce transport emissions in your food', category: 'food' },
];

const Streak = () => {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tipIndex, setTipIndex]   = useState(new Date().getDate() % DAILY_TIPS.length);

  useEffect(() => {
    carbonAPI.getHistory({ limit: 100 })
      .then(r => setRecords(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const heatmap = buildHeatmap(records);

  // Calculate streaks
  const today = new Date().toDateString();
  const dates = new Set(records.map(r => new Date(r.createdAt).toDateString()));

  let currentStreak = 0;
  let d = new Date();
  while (dates.has(d.toDateString())) {
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }

  let longestStreak = 0, temp = 0;
  heatmap.forEach(day => {
    if (day.count > 0) { temp++; longestStreak = Math.max(longestStreak, temp); }
    else temp = 0;
  });

  const totalActiveDays = dates.size;
  const todayDone = dates.has(today);
  const dailyTip = DAILY_TIPS[tipIndex];

  const weeks = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-orange-900/30 to-carbon-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">🔥 Activity Streak</h2>
            <p className="text-carbon-400 text-sm">Track your daily carbon monitoring habits</p>
          </div>
          <motion.div
            animate={{ scale: currentStreak > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-center"
          >
            <p className="text-5xl font-black text-orange-400">{currentStreak}</p>
            <p className="text-xs text-carbon-500">day streak 🔥</p>
          </motion.div>
        </div>

        {/* Today's status */}
        <div className={`mt-4 flex items-center gap-3 p-3 rounded-xl border ${
          todayDone ? 'bg-green-600/10 border-green-600/30' : 'bg-carbon-800/50 border-carbon-700'
        }`}>
          <span className="text-2xl">{todayDone ? '✅' : '⭕'}</span>
          <div>
            <p className={`text-sm font-bold ${todayDone ? 'text-green-400' : 'text-carbon-300'}`}>
              {todayDone ? 'Today\'s calculation done!' : 'No calculation yet today'}
            </p>
            <p className="text-xs text-carbon-500">
              {todayDone ? 'Great job keeping your streak alive!' : 'Go to Calculator to keep your streak going'}
            </p>
          </div>
        </div>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Current Streak', value: currentStreak, icon: '🔥', color: 'text-orange-400', sub: 'days' },
          { label: 'Longest Streak', value: longestStreak, icon: '🏆', color: 'text-yellow-400', sub: 'days' },
          { label: 'Active Days',    value: totalActiveDays, icon: '📅', color: 'text-primary-400', sub: 'total' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-carbon-500 mt-1">{s.sub}</p>
            <p className="text-[10px] text-carbon-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily Tip of the Day */}
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border border-primary-600/20 bg-gradient-to-br from-primary-900/20 to-carbon-900"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-white">💡 Daily Eco Tip</h3>
          <button
            onClick={() => setTipIndex((tipIndex + 1) % DAILY_TIPS.length)}
            className="text-xs text-carbon-500 hover:text-primary-400 transition-colors border border-carbon-700 hover:border-primary-600/30 rounded-lg px-3 py-1"
          >
            Next tip →
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-600/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
            {dailyTip.icon}
          </div>
          <div>
            <p className="text-white font-semibold">{dailyTip.tip}</p>
            <span className="text-xs text-primary-400 mt-1 capitalize inline-block">#{dailyTip.category}</span>
          </div>
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-2">📅 Activity Heatmap</h3>
        <p className="text-xs text-carbon-500 mb-4">Last 10 weeks of carbon tracking activity</p>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                  {week.map((day, di) => (
                    <motion.div
                      key={day.key}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.005 }}
                      title={`${day.date.toLocaleDateString()}: ${day.count} calculation(s)`}
                      className={`w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-125 ${getColor(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-carbon-500">Less</span>
              {['bg-carbon-800', 'bg-primary-900', 'bg-primary-700', 'bg-primary-500'].map((c, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
              ))}
              <span className="text-xs text-carbon-500">More</span>
            </div>
          </>
        )}
      </div>

      {/* Streak rewards */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">🎁 Streak Rewards</h3>
        <div className="space-y-3">
          {[
            { days: 3,  reward: 'Eco Starter badge',     icon: '🌱', done: currentStreak >= 3  },
            { days: 7,  reward: 'Week Warrior badge',     icon: '⚔️', done: currentStreak >= 7  },
            { days: 14, reward: 'Fortnight Fighter badge', icon: '💪', done: currentStreak >= 14 },
            { days: 30, reward: 'Monthly Master badge',   icon: '👑', done: currentStreak >= 30 },
          ].map(r => (
            <div
              key={r.days}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                r.done ? 'bg-primary-600/10 border-primary-600/30' : 'bg-carbon-800/40 border-carbon-700/30'
              }`}
            >
              <span className={`text-2xl ${!r.done && 'grayscale opacity-40'}`}>{r.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${r.done ? 'text-white' : 'text-carbon-400'}`}>
                  {r.days}-Day Streak
                </p>
                <p className="text-xs text-carbon-500">{r.reward}</p>
              </div>
              <div className="text-right">
                {r.done ? (
                  <span className="text-xs text-green-400 font-bold">✅ Earned</span>
                ) : (
                  <span className="text-xs text-carbon-500">{Math.max(0, r.days - currentStreak)} days left</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Streak;
