import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { getScoreColor, formatDate } from '../utils/helpers';
import ScoreGauge from '../components/ui/ScoreGauge';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, dbUser, refreshDbUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: dbUser?.username || '' },
  });

  const scoreInfo = getScoreColor(dbUser?.sustainabilityScore || 0);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await authAPI.updateProfile(data);
      await refreshDbUser();
      setEditing(false);
      toast.success('Profile updated! 🌿');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Eco Points', value: dbUser?.ecoPoints || 0, icon: '⭐', color: 'text-yellow-400' },
    { label: 'Challenges Done', value: dbUser?.completedChallenges?.length || 0, icon: '🏆', color: 'text-orange-400' },
    { label: 'Sustainability Score', value: dbUser?.sustainabilityScore || 0, icon: '📊', color: scoreInfo.text },
    { label: 'Badges Earned', value: dbUser?.badges?.length || 0, icon: '🏅', color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {/* Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary-600/20 border-2 border-primary-600/40 rounded-2xl flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary-400">
                  {(dbUser?.username || user?.email)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-xs">🌿</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label text-left">Display Name</label>
                  <input
                    {...register('username', { required: 'Name is required' })}
                    className="input"
                    placeholder="Your name"
                  />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm py-2 flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm py-2 flex-1">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-black text-white">{dbUser?.username || 'Eco Warrior'}</h2>
                <p className="text-carbon-400 text-sm mt-1">{user?.email}</p>
                <p className="text-carbon-600 text-xs mt-1">Member since {formatDate(dbUser?.createdAt)}</p>
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2 px-4 mt-3">
                  ✏️ Edit Profile
                </button>
              </>
            )}
          </div>

          {/* Score */}
          <ScoreGauge score={dbUser?.sustainabilityScore || 0} size={120} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-carbon-800/50 rounded-xl p-3 text-center">
              <span className="text-xl block mb-1">{s.icon}</span>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-carbon-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Badges */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">🏅 Earned Badges</h3>
        {dbUser?.badges?.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {dbUser.badges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 p-3 bg-carbon-800/50 rounded-xl text-center"
              >
                <span className="text-3xl">🏅</span>
                <p className="text-xs font-semibold text-white">{badge.name}</p>
                <p className="text-[10px] text-carbon-600">{formatDate(badge.earnedAt)}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-carbon-500">
            <span className="text-3xl block mb-2">🏅</span>
            <p className="text-sm">No badges yet. Complete challenges to earn them!</p>
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">🏆 Completed Challenges</h3>
        <div className="text-center py-4 text-carbon-500">
          <span className="text-3xl block mb-2">🏆</span>
          <p className="text-sm">{dbUser?.completedChallenges?.length || 0} challenges completed</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: user?.email, icon: '📧' },
            { label: 'Auth Provider', value: user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password', icon: '🔐' },
            { label: 'Account Created', value: formatDate(dbUser?.createdAt), icon: '📅' },
            { label: 'User ID', value: dbUser?.firebaseUID?.slice(0, 16) + '...', icon: '🪪' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-carbon-800/40 rounded-xl">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-xs text-carbon-500">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
