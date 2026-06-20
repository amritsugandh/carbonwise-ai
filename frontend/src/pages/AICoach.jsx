import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, carbonAPI } from '../services/api';
import { formatNumber } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'How can I reduce my carbon footprint?',
  'What are the best ways to save electricity?',
  'How does my diet affect emissions?',
  'Suggest a weekly eco plan for me',
  'What is carbon offsetting?',
  'How do electric vehicles help the environment?',
];

const AICoach = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm CarbonWise AI Coach 🌿 I'm here to help you reduce your carbon footprint with personalized advice. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchLatestData = useCallback(async () => {
    try {
      const res = await carbonAPI.getHistory({ limit: 1 });
      if (res.data.data?.length > 0) setLatestData(res.data.data[0]);
    } catch {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { fetchLatestData(); }, [fetchLatestData]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: userMsg });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.data.message, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!latestData) {
      toast.error('No carbon data found. Please calculate your footprint first.');
      return;
    }
    setLoadingRecs(true);
    try {
      const res = await aiAPI.getRecommendations({ emissionData: latestData });
      setRecommendations(res.data.data);
      toast.success('AI recommendations generated! 🤖');
    } catch (err) {
      toast.error('Failed to generate recommendations. Please try again.');
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-900/30 to-carbon-900">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-600/30 rounded-2xl flex items-center justify-center text-3xl">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-black text-white">CarbonWise AI Coach</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-carbon-400">Powered by Gemini AI · Online</span>
            </div>
          </div>
          <button
            onClick={getRecommendations}
            disabled={loadingRecs}
            className="btn-primary ml-auto text-sm"
          >
            {loadingRecs ? <Spinner size="sm" /> : '✨ Get AI Tips'}
          </button>
        </div>

        {/* Latest data banner */}
        {latestData && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Transport', value: latestData.transportEmission, icon: '🚗' },
              { label: 'Electricity', value: latestData.electricityEmission, icon: '⚡' },
              { label: 'Food', value: latestData.foodEmission, icon: '🍽️' },
              { label: 'Total', value: latestData.totalEmission, icon: '🌍' },
            ].map((item) => (
              <div key={item.label} className="bg-carbon-800/50 rounded-xl p-2 text-center">
                <span className="text-sm">{item.icon}</span>
                <p className="text-xs font-bold text-white">{formatNumber(item.value)}</p>
                <p className="text-[10px] text-carbon-500">kg CO₂</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations Panel */}
      <AnimatePresence>
        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card border border-blue-600/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🤖 AI Recommendations</h3>
              <button onClick={() => setRecommendations(null)} className="text-carbon-500 hover:text-white text-sm" aria-label="Close recommendations">✕</button>
            </div>

            {recommendations.summary && (
              <p className="text-carbon-300 text-sm mb-4 p-3 bg-blue-600/10 rounded-xl">{recommendations.summary}</p>
            )}

            {recommendations.tips?.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-semibold text-carbon-400">Personalized Tips</h4>
                {recommendations.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-carbon-800/50 rounded-xl">
                    <span className="text-primary-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{tip.title}</p>
                      <p className="text-xs text-carbon-400 mt-0.5">{tip.description}</p>
                      {tip.impact && <p className="text-xs text-primary-400 mt-1">💚 {tip.impact}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendations.weeklyPlan?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-carbon-400 mb-2">Weekly Improvement Plan</h4>
                <div className="grid grid-cols-2 gap-2">
                  {recommendations.weeklyPlan.map((plan, i) => (
                    <div key={i} className="p-2 bg-carbon-800/30 rounded-lg text-xs text-carbon-300">
                      <span className="text-primary-400 font-bold">Day {i * 2 + 1}-{Math.min(7, i * 2 + 2)}:</span> {plan}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.offsetSuggestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-carbon-400 mb-2">Carbon Offset Ideas</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendations.offsetSuggestions.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 bg-primary-600/10 text-primary-400 border border-primary-600/20 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <div className="card flex flex-col" style={{ height: '500px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : msg.isError
                      ? 'bg-red-600/10 border border-red-600/20 text-red-400 rounded-tl-sm'
                      : 'bg-carbon-800 text-carbon-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-carbon-600 mt-1 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0">🤖</div>
              <div className="bg-carbon-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-carbon-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="whitespace-nowrap text-xs px-3 py-1.5 bg-carbon-800 hover:bg-carbon-700 text-carbon-300 hover:text-white rounded-full transition-all flex-shrink-0 border border-carbon-700"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about reducing your carbon footprint..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
            aria-label="Send message"
          >
            {loading ? <Spinner size="sm" /> : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
