import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import { getDifficultyColor, getCategoryIcon } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

// ── Badge Celebration Modal ───────────────────────────────────────────────────
const BadgeCelebration = ({ badges, onClose }) => (
  <AnimatePresence>
    {badges.length > 0 && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative z-10 bg-carbon-900 border border-yellow-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * 300, opacity: 1 }}
                animate={{ y: 400, opacity: 0, rotate: Math.random() * 360 }}
                transition={{ duration: 2, delay: i * 0.1 }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: ['#22c55e', '#eab308', '#f97316', '#a855f7', '#3b82f6'][i % 5] }}
              />
            ))}
          </div>

          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl mb-4 block"
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-1">Badge Earned!</h2>
          <p className="text-carbon-400 text-sm mb-6">You've unlocked new achievement badges</p>

          <div className="space-y-3 mb-6">
            {badges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
              >
                <span className="text-3xl">{badge.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-yellow-400">{badge.name}</p>
                  <p className="text-xs text-carbon-500">Achievement Unlocked</p>
                </div>
                <span className="ml-auto text-yellow-400 text-xl">✨</span>
              </motion.div>
            ))}
          </div>

          <button onClick={onClose} className="btn-primary w-full">
            Awesome! 🌿
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Challenges = () => {
  const { refreshDbUser, dbUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newBadges, setNewBadges] = useState([]);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await challengesAPI.getAll();
      setChallenges(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleComplete = async (challengeId) => {
    setCompleting(challengeId);
    try {
      const res = await challengesAPI.complete(challengeId);
      const { pointsEarned, newBadges: earned = [], totalPoints } = res.data;

      // Show toast
      toast.success(`🏆 +${pointsEarned} eco points earned!`);

      // Show badge celebration if badges were earned
      if (earned.length > 0) {
        setNewBadges(earned);
      }

      // Refresh user data and challenge list
      await refreshDbUser();
      fetchChallenges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete challenge');
    } finally {
      setCompleting(null);
    }
  };

  const categories = ['all', 'transport', 'energy', 'food', 'lifestyle', 'nature'];
  const filtered = filter === 'all' ? challenges : challenges.filter((c) => c.category === filter);
  const completedCount = challenges.filter((c) => c.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Badge Celebration Modal */}
      <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />

      {/* Header */}
      <div className="card bg-gradient-to-r from-yellow-900/30 to-carbon-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Eco Challenges</h2>
            <p className="text-carbon-400 text-sm">Complete challenges to earn eco points and badges</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-yellow-400">{dbUser?.ecoPoints || 0}</p>
            <p className="text-xs text-carbon-500">Total Eco Points</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 bg-carbon-800 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: challenges.length ? `${(completedCount / challenges.length) * 100}%` : '0%' }}
              transition={{ duration: 1 }}
              className="h-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
            />
          </div>
          <span className="text-sm font-semibold text-carbon-400 whitespace-nowrap">
            {completedCount}/{challenges.length} done
          </span>
        </div>
      </div>

      {/* Earned Badges */}
      {dbUser?.badges?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-3">🏅 Your Badges ({dbUser.badges.length})</h3>
          <div className="flex flex-wrap gap-2">
            {dbUser.badges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 bg-yellow-600/10 border border-yellow-600/20 rounded-xl px-3 py-2"
              >
                <span className="text-lg">{badge.icon || '🏅'}</span>
                <span className="text-sm font-semibold text-yellow-400">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-primary-600 text-white'
                : 'bg-carbon-800 text-carbon-400 hover:bg-carbon-700'
            }`}
          >
            {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((challenge, i) => {
            const diffColor = getDifficultyColor(challenge.difficulty);
            return (
              <motion.div
                key={challenge._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card relative overflow-hidden transition-all ${
                  challenge.isCompleted ? 'border border-green-600/20 bg-green-900/5' : ''
                }`}
              >
                {/* Completed ribbon */}
                {challenge.isCompleted && (
                  <div className="absolute top-3 right-3 bg-green-600/20 border border-green-600/30 rounded-full px-2 py-0.5 text-xs text-green-400 font-semibold flex items-center gap-1">
                    ✅ Done
                  </div>
                )}

                {/* Challenge icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                    challenge.isCompleted ? 'bg-green-600/10' : 'bg-carbon-800'
                  }`}>
                    {challenge.icon || getCategoryIcon(challenge.category)}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h4 className="font-bold text-white text-sm mb-1">{challenge.title}</h4>
                    <p className="text-xs text-carbon-400 leading-relaxed">{challenge.description}</p>
                  </div>
                </div>

                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant="warning" size="xs">⭐ {challenge.points} pts</Badge>
                  <span className={`badge text-[10px] px-2 py-0.5 ${diffColor.bg} ${diffColor.text} border ${diffColor.border}`}>
                    {challenge.difficulty}
                  </span>
                  <Badge variant="info" size="xs">
                    {getCategoryIcon(challenge.category)} {challenge.category}
                  </Badge>
                  <span className="text-xs text-carbon-500">⏱️ {challenge.duration}d</span>
                </div>

                {/* Badge reward preview */}
                {challenge.badge && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-600/5 border border-yellow-600/15 rounded-xl">
                    <span className="text-base">🏅</span>
                    <p className="text-xs text-yellow-400 font-medium">
                      Earns badge: <span className="font-bold">"{challenge.badge}"</span>
                    </p>
                  </div>
                )}

                {challenge.emissionReduction > 0 && (
                  <p className="text-xs text-primary-400 mb-4">
                    🌱 Reduces ~{challenge.emissionReduction} kg CO₂
                  </p>
                )}

                {/* Complete button */}
                <button
                  onClick={() => handleComplete(challenge._id)}
                  disabled={challenge.isCompleted || completing === challenge._id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    challenge.isCompleted
                      ? 'bg-green-900/20 text-green-500 cursor-not-allowed border border-green-600/20'
                      : 'btn-primary'
                  }`}
                >
                  {completing === challenge._id ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" /> Completing...
                    </div>
                  ) : challenge.isCompleted ? (
                    '✅ Challenge Completed'
                  ) : (
                    `🏆 Complete (+${challenge.points} pts)`
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Achievement badges info */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">🎯 Achievement Milestones</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { badge: '🌱', name: 'Eco Beginner',        desc: 'Complete 1 challenge',     done: (dbUser?.completedChallenges?.length || 0) >= 1 },
            { badge: '⚔️', name: 'Green Warrior',        desc: 'Complete 3 challenges',    done: (dbUser?.completedChallenges?.length || 0) >= 3 },
            { badge: '💚', name: 'Carbon Saver',         desc: 'Earn 100 eco points',      done: (dbUser?.ecoPoints || 0) >= 100 },
            { badge: '🏆', name: 'Eco Champion',         desc: 'Complete 5 challenges',    done: (dbUser?.completedChallenges?.length || 0) >= 5 },
            { badge: '⭐', name: 'Sustainability Star',  desc: 'Earn 300 eco points',      done: (dbUser?.ecoPoints || 0) >= 300 },
            { badge: '🌍', name: 'Planet Protector',     desc: 'Complete all 8 challenges',done: (dbUser?.completedChallenges?.length || 0) >= 8 },
          ].map((a) => (
            <div
              key={a.name}
              className={`rounded-xl p-3 text-center transition-all border ${
                a.done
                  ? 'bg-yellow-600/10 border-yellow-600/30'
                  : 'bg-carbon-800/50 border-carbon-700/30'
              }`}
            >
              <span className={`text-2xl block mb-1 ${!a.done && 'grayscale opacity-40'}`}>{a.badge}</span>
              <p className={`text-xs font-semibold ${a.done ? 'text-yellow-400' : 'text-carbon-400'}`}>{a.name}</p>
              <p className="text-[10px] text-carbon-500 mt-0.5">{a.desc}</p>
              {a.done && <p className="text-[10px] text-green-400 mt-1 font-bold">✅ Earned!</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
