import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { carbonAPI } from '../services/api';
import { formatDate, formatNumber, EMISSION_CATEGORIES } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const History = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', page: 1 });
  const [pagination, setPagination] = useState({});

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await carbonAPI.getHistory({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: filters.page,
        limit: 10,
      });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Chart data
  const chartData = records
    .slice(0, 10)
    .reverse()
    .map((r) => ({
      date: formatDate(r.createdAt).slice(0, 6),
      total: r.totalEmission,
      transport: r.transportEmission,
      electricity: r.electricityEmission,
      food: r.foodEmission,
      lifestyle: r.lifestyleEmission,
    }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Filter Records</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="input"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', page: 1 })}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Emission History Chart</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
              />
              <Bar dataKey="transport" stackId="a" fill="#f97316" name="Transport" />
              <Bar dataKey="electricity" stackId="a" fill="#eab308" name="Electricity" />
              <Bar dataKey="food" stackId="a" fill="#22c55e" name="Food" />
              <Bar dataKey="lifestyle" stackId="a" fill="#a855f7" name="Lifestyle" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">All Records</h3>
          <span className="text-sm text-carbon-500">{pagination.total || 0} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-carbon-500">
            <span className="text-4xl block mb-3">📊</span>
            <p>No records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, i) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-carbon-800/50 border border-carbon-700/50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-black text-white">{formatNumber(record.totalEmission)} <span className="text-sm font-normal text-carbon-400">kg CO₂</span></p>
                    <p className="text-xs text-carbon-500">{formatDate(record.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-carbon-500 mb-1">Score</div>
                    <div className="text-lg font-bold text-primary-400">{record.sustainabilityScore}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {EMISSION_CATEGORIES.map((cat) => (
                    <div key={cat.key} className="text-center bg-carbon-900/50 rounded-lg p-2">
                      <div className="text-xs">{cat.icon}</div>
                      <div className="text-xs font-bold text-white mt-0.5">{formatNumber(record[cat.key])}</div>
                      <div className="text-[10px] text-carbon-600">kg</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="flex items-center text-sm text-carbon-400">
              {filters.page} / {pagination.pages}
            </span>
            <button
              disabled={filters.page >= pagination.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
