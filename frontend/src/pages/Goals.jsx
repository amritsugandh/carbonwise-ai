import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { goalsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { formatDate, formatNumber, getCategoryIcon } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const Goals = () => {
  const { dbUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalsAPI.getAll();
      setGoals(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const openCreate = () => { setEditGoal(null); reset(); setShowModal(true); };
  const openEdit = (goal) => {
    setEditGoal(goal);
    setValue('title', goal.title);
    setValue('description', goal.description);
    setValue('targetEmission', goal.targetEmission);
    setValue('category', goal.category);
    setValue('deadline', goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        targetEmission: Number(data.targetEmission),
        currentEmission: dbUser?.totalEmission || 0,
      };
      if (editGoal) {
        await goalsAPI.update(editGoal._id, payload);
        toast.success('Goal updated!');
      } else {
        await goalsAPI.create(payload);
        toast.success('Goal created! 🎯');
      }
      setShowModal(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await goalsAPI.delete(id);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed to delete goal'); }
  };

  const statusColors = {
    active: 'primary',
    completed: 'success',
    paused: 'warning',
    failed: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Reduction Goals</h2>
          <p className="text-carbon-400 text-sm mt-1">Set and track your emission reduction targets</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Goal</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: goals.filter((g) => g.status === 'active').length, color: 'text-primary-400' },
          { label: 'Completed', count: goals.filter((g) => g.status === 'completed').length, color: 'text-green-400' },
          { label: 'Total', count: goals.length, color: 'text-white' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-carbon-500 mt-1">{s.label} Goals</p>
          </div>
        ))}
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl block mb-4">🎯</span>
          <h3 className="text-xl font-bold text-white mb-2">No Goals Yet</h3>
          <p className="text-carbon-400 text-sm mb-6">Create your first carbon reduction goal!</p>
          <button onClick={openCreate} className="btn-primary">Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal, i) => (
            <motion.div
              key={goal._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                  <div>
                    <h4 className="font-bold text-white">{goal.title}</h4>
                    {goal.description && <p className="text-xs text-carbon-500 mt-0.5">{goal.description}</p>}
                  </div>
                </div>
                <Badge variant={statusColors[goal.status] || 'default'}>
                  {goal.status}
                </Badge>
              </div>

              {/* Emissions */}
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="text-center">
                  <p className="text-carbon-500 text-xs">Current</p>
                  <p className="font-bold text-white">{formatNumber(goal.currentEmission)} kg</p>
                </div>
                <div className="text-carbon-600">→</div>
                <div className="text-center">
                  <p className="text-carbon-500 text-xs">Target</p>
                  <p className="font-bold text-primary-400">{formatNumber(goal.targetEmission)} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-carbon-500 text-xs">Reduction</p>
                  <p className="font-bold text-green-400">
                    {formatNumber(Math.max(0, goal.currentEmission - goal.targetEmission))} kg
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-carbon-400 mb-1">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <ProgressBar
                  value={goal.progress}
                  max={100}
                  color={goal.status === 'completed' ? 'green' : goal.progress > 60 ? 'primary' : 'yellow'}
                  showLabel={false}
                />
              </div>

              {goal.deadline && (
                <p className="text-xs text-carbon-500 mb-3">⏰ Deadline: {formatDate(goal.deadline)}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(goal)} className="btn-secondary text-xs py-2 px-3 flex-1">✏️ Edit</button>
                <button onClick={() => handleDelete(goal._id)} className="text-xs py-2 px-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-600/20 transition-all flex-1">🗑️ Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editGoal ? 'Edit Goal' : 'Create New Goal'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Goal Title</label>
            <input {...register('title', { required: 'Title is required' })} placeholder="Reduce transport emissions" className="input" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea {...register('description')} placeholder="Goal details..." rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Emission (kg CO₂)</label>
              <input {...register('targetEmission', { required: 'Target is required', min: { value: 0, message: 'Must be positive' } })} type="number" placeholder="90" className="input" />
              {errors.targetEmission && <p className="text-red-400 text-xs mt-1">{errors.targetEmission.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="overall">Overall</option>
                <option value="transport">Transport</option>
                <option value="electricity">Electricity</option>
                <option value="food">Food</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Deadline (optional)</label>
            <input {...register('deadline')} type="date" className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{editGoal ? 'Update Goal' : 'Create Goal'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;
