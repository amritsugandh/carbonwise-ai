import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { leaderboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getScoreColor, formatNumber } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const Leaderboard = () => {
  const { dbUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaderboardAPI.get({ period });
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const top3 = data?.leaderboard?.slice(0, 3) || [];
  const rest = data?.leaderboard?.slice(3) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-yellow-900/30 to-carbon-900">
        <h2 className="text-2xl font-black text-white mb-1">🏆 Leaderboard</h2>
        <p className="text-carbon-400 text-sm">Top eco warriors ranked by points & sustainability score</p>
        {data?.userRank && (
          <div className="mt-3 inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-xl px-4 py-2">
            <span className="text-primary-400 font-bold">Your Rank: #{data.userRank}</span>
          </div>
        )}
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2">
        {['all', 'monthly', 'weekly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              period === p ? 'bg-primary-600 text-white' : 'bg-carbon-800 text-carbon-400 hover:bg-carbon-700'
            }`}
          >
            {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !data?.leaderboard?.length ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">🏆</span>
          <p className="text-carbon-400">No users on the leaderboard yet. Be the first!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-6 text-center">Top Eco Warriors</h3>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 bg-carbon-700 rounded-full flex items-center justify-center overflow-hidden mb-2 border-2 border-gray-400">
                    {top3[1]?.avatar ? (
                      <img src={top3[1].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-white">{top3[1]?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-2xl">🥈</span>
                  <p className="text-sm font-bold text-white mt-1 max-w-[80px] truncate text-center">{top3[1]?.username}</p>
                  <p className="text-xs text-carbon-400">{top3[1]?.ecoPoints} pts</p>
                  <div className="w-20 h-16 bg-gray-600/30 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-gray-400 font-black">2</span>
                  </div>
                </motion.div>

                {/* 1st place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-18 h-18 w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center overflow-hidden mb-2 border-2 border-yellow-400">
                    {top3[0]?.avatar ? (
                      <img src={top3[0].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-yellow-400">{top3[0]?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-3xl">🥇</span>
                  <p className="text-sm font-black text-yellow-400 mt-1 max-w-[90px] truncate text-center">{top3[0]?.username}</p>
                  <p className="text-xs text-carbon-400">{top3[0]?.ecoPoints} pts</p>
                  <div className="w-24 h-24 bg-yellow-600/20 rounded-t-xl mt-2 flex items-center justify-center border border-yellow-600/30">
                    <span className="text-yellow-400 font-black text-xl">1</span>
                  </div>
                </motion.div>

                {/* 3rd place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 bg-carbon-700 rounded-full flex items-center justify-center overflow-hidden mb-2 border-2 border-amber-600">
                    {top3[2]?.avatar ? (
                      <img src={top3[2].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-white">{top3[2]?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-2xl">🥉</span>
                  <p className="text-sm font-bold text-white mt-1 max-w-[80px] truncate text-center">{top3[2]?.username}</p>
                  <p className="text-xs text-carbon-400">{top3[2]?.ecoPoints} pts</p>
                  <div className="w-20 h-12 bg-amber-800/30 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-amber-600 font-black">3</span>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Full Rankings */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Full Rankings</h3>
            <div className="space-y-2">
              {data.leaderboard.map((user, i) => {
                const isCurrentUser = user._id === dbUser?._id;
                const scoreInfo = getScoreColor(user.sustainabilityScore);
                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-primary-600/10 border border-primary-600/20'
                        : 'bg-carbon-800/40 hover:bg-carbon-800/60'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center font-black text-lg">{getRankIcon(user.rank)}</div>

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-carbon-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{user.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-primary-400' : 'text-white'}`}>
                        {user.username || user.email?.split('@')[0]}
                        {isCurrentUser && <span className="text-xs text-carbon-500 ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-carbon-500">{user.totalEmission ? `${formatNumber(user.totalEmission)} kg CO₂` : 'No data'}</p>
                    </div>

                    {/* Score */}
                    <div className="text-center hidden sm:block">
                      <p className={`text-sm font-bold ${scoreInfo.text}`}>{user.sustainabilityScore}</p>
                      <p className="text-[10px] text-carbon-600">score</p>
                    </div>

                    {/* Points */}
                    <div className="text-center">
                      <p className="text-sm font-bold text-yellow-400">{user.ecoPoints}</p>
                      <p className="text-[10px] text-carbon-600">pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
