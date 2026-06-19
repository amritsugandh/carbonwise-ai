import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { predictionsAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';
import { formatNumber, getRiskColor, getTrendIcon } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const Predictions = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPrediction = useCallback(async () => {
    try {
      const res = await predictionsAPI.getLatest();
      setPrediction(res.data.data);
    } catch {
      // no prediction yet — 404 is expected
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrediction(); }, [fetchPrediction]);

  const generatePrediction = async () => {
    setGenerating(true);
    try {
      const res = await predictionsAPI.generate();
      setPrediction(res.data.data);
      toast.success('Prediction generated! 🔮');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Add more carbon records first.');
    } finally {
      setGenerating(false);
    }
  };

  const riskInfo = prediction ? getRiskColor(prediction.riskLevel?.level) : null;
  const trendInfo = prediction ? getTrendIcon(prediction.trend?.direction) : null;

  // Build chart data with historical/predicted separation
  const chartData = prediction?.chartData?.map((d) => ({
    ...d,
    historical: d.type === 'historical' ? d.emission : null,
    predicted: d.type === 'predicted' ? d.emission : null,
    // bridge point
    bridge: d.type === 'predicted' && prediction?.chartData?.findIndex((x) => x.type === 'predicted') ===
      prediction?.chartData?.indexOf(d) ? d.emission : null,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-900/30 to-carbon-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">AI Carbon Predictions</h2>
            <p className="text-carbon-400 text-sm">Powered by weighted analysis & Gemini AI insights</p>
          </div>
          <button
            onClick={generatePrediction}
            disabled={generating}
            className="btn-primary whitespace-nowrap"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                Analyzing...
              </div>
            ) : '🔮 Generate Forecast'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !prediction ? (
        <div className="card text-center py-16">
          <span className="text-5xl block mb-4">🔮</span>
          <h3 className="text-xl font-bold text-white mb-2">No Predictions Yet</h3>
          <p className="text-carbon-400 text-sm mb-6">You need at least 1 carbon calculation to generate predictions.</p>
          <button onClick={generatePrediction} disabled={generating} className="btn-primary">
            Generate My First Prediction
          </button>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📍" label="Current" value={formatNumber(prediction.currentEmission)} unit="kg CO₂" color="primary" />
            <StatCard icon="📅" label="Next Week" value={formatNumber(prediction.predictedNextWeek)} unit="kg CO₂" color="blue" />
            <StatCard icon="📆" label="Next Month" value={formatNumber(prediction.predictedNextMonth)} unit="kg CO₂" color="purple" />
            <StatCard icon="🗓️" label="3 Months" value={formatNumber(prediction.predictedThreeMonths)} unit="kg CO₂" color="orange" />
          </div>

          {/* Risk + Trend + Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Risk Level */}
            <div className={`card border ${riskInfo?.bg} border-current`}>
              <p className="text-xs text-carbon-500 mb-2">Risk Level</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{riskInfo?.icon}</span>
                <span className={`text-2xl font-black ${riskInfo?.text}`}>{prediction.riskLevel?.level}</span>
              </div>
            </div>

            {/* Trend */}
            <div className="card">
              <p className="text-xs text-carbon-500 mb-2">Emission Trend</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{trendInfo?.icon}</span>
                <div>
                  <p className={`text-lg font-black ${trendInfo?.text}`}>{trendInfo?.label}</p>
                  <p className="text-xs text-carbon-500">
                    {Math.abs(prediction.trend?.percentageChange || 0).toFixed(1)}% change
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="card">
              <p className="text-xs text-carbon-500 mb-2">AI Confidence</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-2xl font-black text-primary-400">{prediction.confidenceScore}%</p>
                  <p className="text-xs text-carbon-500">Prediction accuracy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-2">Emission Forecast Chart</h3>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary-500" />
                <span className="text-carbon-400">Historical Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-purple-500 border-t-2 border-dashed border-purple-500" style={{ borderTop: '2px dashed #a855f7', height: 0 }} />
                <span className="text-carbon-400">Predicted Data</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(v, name) => [`${formatNumber(v)} kg CO₂`, name === 'historical' ? 'Historical' : 'Predicted']}
                />
                <Area type="monotone" dataKey="historical" fill="#22c55e20" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} connectNulls />
                <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#a855f7', r: 4 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          {prediction.aiInsights?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">🤖 AI Prediction Insights</h3>
              <div className="space-y-3">
                {prediction.aiInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-purple-600/10 border border-purple-600/20 rounded-xl"
                  >
                    <span className="text-purple-400 mt-0.5">💡</span>
                    <p className="text-sm text-carbon-300">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Carbon Offset Suggestions */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">🌱 Carbon Offset Recommendations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🌳', title: 'Plant Trees', desc: 'Each tree absorbs ~21 kg CO₂/year. Plant locally or donate to reforestation projects.' },
                { icon: '☀️', title: 'Renewable Energy', desc: 'Switch to solar panels or purchase green energy credits from renewable sources.' },
                { icon: '♻️', title: 'Recycling Programs', desc: 'Participate in community recycling to reduce manufacturing emissions.' },
              ].map((item) => (
                <div key={item.title} className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-4">
                  <span className="text-3xl block mb-2">{item.icon}</span>
                  <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-carbon-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Predictions;
