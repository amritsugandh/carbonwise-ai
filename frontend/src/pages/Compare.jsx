import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { carbonAPI } from '../services/api';
import { formatNumber } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

// Global benchmark data (kg CO₂/month)
const BENCHMARKS = {
  global:  { transport: 80,  electricity: 120, food: 100, lifestyle: 33,  total: 333,  label: 'Global Avg', color: '#64748b' },
  india:   { transport: 45,  electricity: 65,  food: 70,  lifestyle: 20,  total: 200,  label: 'India Avg',  color: '#f97316' },
  usa:     { transport: 180, electricity: 220, food: 150, lifestyle: 80,  total: 630,  label: 'USA Avg',    color: '#3b82f6' },
  europe:  { transport: 90,  electricity: 100, food: 110, lifestyle: 40,  total: 340,  label: 'Europe Avg', color: '#8b5cf6' },
  china:   { transport: 70,  electricity: 150, food: 90,  lifestyle: 30,  total: 340,  label: 'China Avg',  color: '#ef4444' },
};

const Compare = () => {
  const [myData, setMyData]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(['global', 'india']);

  useEffect(() => {
    carbonAPI.getHistory({ limit: 1 })
      .then(r => { if (r.data.data?.length) setMyData(r.data.data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myTotal = myData?.totalEmission || 0;

  // Bar chart comparison data
  const barData = [
    { category: 'Transport',   me: myData?.transportEmission   || 0, ...Object.fromEntries(selected.map(k => [k, BENCHMARKS[k].transport]))   },
    { category: 'Electricity', me: myData?.electricityEmission || 0, ...Object.fromEntries(selected.map(k => [k, BENCHMARKS[k].electricity])) },
    { category: 'Food',        me: myData?.foodEmission        || 0, ...Object.fromEntries(selected.map(k => [k, BENCHMARKS[k].food]))        },
    { category: 'Lifestyle',   me: myData?.lifestyleEmission   || 0, ...Object.fromEntries(selected.map(k => [k, BENCHMARKS[k].lifestyle]))   },
  ];

  // Radar chart data
  const radarData = ['Transport', 'Electricity', 'Food', 'Lifestyle'].map((cat, i) => {
    const keys = ['transport', 'electricity', 'food', 'lifestyle'];
    const dataKeys = ['transportEmission', 'electricityEmission', 'foodEmission', 'lifestyleEmission'];
    const entry = { subject: cat, me: myData?.[dataKeys[i]] || 0 };
    selected.forEach(k => { entry[k] = BENCHMARKS[k][keys[i]]; });
    return entry;
  });

  // How much better/worse vs global
  const vsGlobal = myTotal > 0 ? (((myTotal - BENCHMARKS.global.total) / BENCHMARKS.global.total) * 100).toFixed(1) : null;

  const toggleBenchmark = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const COLORS = { me: '#22c55e', ...Object.fromEntries(Object.entries(BENCHMARKS).map(([k, v]) => [k, v.color])) };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-900/30 to-carbon-900">
        <h2 className="text-2xl font-black text-white mb-1">🌍 Carbon Comparison</h2>
        <p className="text-carbon-400 text-sm">See how your footprint stacks up against global averages</p>

        {vsGlobal && (
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${
            Number(vsGlobal) < 0
              ? 'bg-green-600/10 border-green-600/30 text-green-400'
              : 'bg-red-600/10 border-red-600/30 text-red-400'
          }`}>
            {Number(vsGlobal) < 0 ? '✅' : '⚠️'}
            You emit {Math.abs(vsGlobal)}% {Number(vsGlobal) < 0 ? 'less' : 'more'} than the global average
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !myData ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">📊</span>
          <p className="text-carbon-400">No carbon data yet. Calculate your footprint first!</p>
        </div>
      ) : (
        <>
          {/* Benchmark selector */}
          <div className="card">
            <h3 className="text-base font-bold text-white mb-3">Compare Against</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BENCHMARKS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => toggleBenchmark(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    selected.includes(key)
                      ? 'text-white border-transparent'
                      : 'bg-carbon-800 text-carbon-400 border-carbon-700 hover:bg-carbon-700'
                  }`}
                  style={selected.includes(key) ? { backgroundColor: val.color + '30', borderColor: val.color + '60', color: val.color } : {}}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total comparison cards */}
          <div className={`grid gap-4 ${
            selected.length + 1 <= 2 ? 'grid-cols-2' :
            selected.length + 1 <= 3 ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary-600/20 to-emerald-600/10 border border-primary-600/30 rounded-2xl p-4 text-center"
            >
              <p className="text-xs text-carbon-400 mb-1">🌿 You</p>
              <p className="text-3xl font-black text-primary-400">{formatNumber(myTotal)}</p>
              <p className="text-xs text-carbon-500">kg CO₂/month</p>
            </motion.div>

            {selected.map((key, i) => {
              const bench = BENCHMARKS[key];
              const diff = myTotal - bench.total;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl p-4 text-center border"
                  style={{ backgroundColor: bench.color + '15', borderColor: bench.color + '40' }}
                >
                  <p className="text-xs text-carbon-400 mb-1">{bench.label}</p>
                  <p className="text-3xl font-black" style={{ color: bench.color }}>{bench.total}</p>
                  <p className="text-xs text-carbon-500">kg CO₂/month</p>
                  <p className={`text-xs font-semibold mt-1 ${diff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diff < 0 ? `↓ ${Math.abs(diff).toFixed(0)} less` : `↑ ${diff.toFixed(0)} more`}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bar Chart */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Category Breakdown Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(v) => [`${formatNumber(v)} kg`, '']}
                />
                <Legend />
                <Bar dataKey="me" name="You" fill="#22c55e" radius={[4, 4, 0, 0]} />
                {selected.map(k => (
                  <Bar key={k} dataKey={k} name={BENCHMARKS[k].label} fill={BENCHMARKS[k].color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Emission Profile Radar</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Radar name="You" dataKey="me" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
                {selected.map(k => (
                  <Radar key={k} name={BENCHMARKS[k].label} dataKey={k} stroke={BENCHMARKS[k].color} fill={BENCHMARKS[k].color} fillOpacity={0.1} strokeWidth={1.5} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Fun facts */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">🌳 Real World Equivalent</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: '🌳', label: 'Trees needed/year', value: Math.ceil((myTotal * 12) / 21), sub: 'to offset your emissions' },
                { icon: '🚗', label: 'km by car', value: Math.round(myTotal / 0.21).toLocaleString(), sub: 'equivalent driving' },
                { icon: '✈️', label: 'Short flights', value: (myTotal / 255).toFixed(1), sub: 'equivalent per month' },
                { icon: '💡', label: 'LED bulb hours', value: Math.round(myTotal / 0.82 * 1000 / 9).toLocaleString(), sub: 'at 9W per bulb' },
              ].map((item) => (
                <div key={item.label} className="bg-carbon-800/50 rounded-xl p-4 text-center">
                  <span className="text-3xl block mb-2">{item.icon}</span>
                  <p className="text-xl font-black text-white">{item.value}</p>
                  <p className="text-xs font-semibold text-carbon-300 mt-1">{item.label}</p>
                  <p className="text-[10px] text-carbon-500">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Compare;
