import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Reset email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.code === 'auth/user-not-found' ? 'No account found with this email' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
      <div className="text-center mb-6">
        <span className="text-4xl">🔒</span>
        <h2 className="text-2xl font-black text-white mt-3 mb-2">Reset Password</h2>
        <p className="text-carbon-400 text-sm">Enter your email to receive a reset link</p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-white font-semibold mb-2">Email Sent!</p>
          <p className="text-carbon-400 text-sm mb-6">Check your inbox for the password reset link.</p>
          <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
              })}
              type="email"
              placeholder="you@example.com"
              className="input"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <Link to="/login" className="block text-center text-sm text-carbon-400 hover:text-carbon-300 transition-colors">
            ← Back to Login
          </Link>
        </form>
      )}
    </motion.div>
  );
};

export default ForgotPassword;
