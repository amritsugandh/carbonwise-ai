import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { reportsAPI } from '../services/api';
import { formatDate, formatNumber, getScoreColor, EMISSION_CATEGORIES } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState(null);
  const printRef = useRef();

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res = await reportsAPI.getAll();
      setReports(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await reportsAPI.generate();
      setPreviewReport(res.data.data.reportData);
      toast.success('Report generated! 📋');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (id) => {
    try {
      const res = await reportsAPI.download(id);
      setPreviewReport(res.data.data.reportData);
    } catch { toast.error('Failed to load report'); }
  };

  const handlePrint = () => {
    window.print();
  };

  const scoreInfo = previewReport?.user
    ? getScoreColor(previewReport.user.sustainabilityScore || 0)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Sustainability Reports</h2>
          <p className="text-carbon-400 text-sm mt-1">Generate and download your carbon analysis reports</p>
        </div>
        <button onClick={generateReport} disabled={generating} className="btn-primary">
          {generating ? (
            <div className="flex items-center gap-2"><Spinner size="sm" /> Generating...</div>
          ) : '📋 Generate Report'}
        </button>
      </div>

      {/* Report Preview */}
      {previewReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          ref={printRef}
          className="card border border-primary-600/20 print:block print:border-0"
          id="report-content"
        >
          {/* Report Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🌿</span>
                <div>
                  <h3 className="text-xl font-black text-white">CarbonWise AI Report</h3>
                  <p className="text-xs text-carbon-500">Generated: {formatDate(previewReport.generatedAt)}</p>
                </div>
              </div>
              <p className="text-sm text-carbon-400">
                Sustainability analysis for <span className="text-white font-semibold">{previewReport.user?.name}</span>
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="btn-secondary text-sm py-2 px-4 print:hidden"
            >
              🖨️ Print / Save PDF
            </button>
          </div>

          {/* User Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{previewReport.user?.ecoPoints || 0}</p>
              <p className="text-xs text-carbon-500 mt-1">⭐ Eco Points</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${scoreInfo?.bg}`}>
              <p className={`text-2xl font-black ${scoreInfo?.text}`}>{previewReport.user?.sustainabilityScore || 0}</p>
              <p className="text-xs text-carbon-500 mt-1">📊 Score</p>
            </div>
            <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{previewReport.summary?.totalRecords || 0}</p>
              <p className="text-xs text-carbon-500 mt-1">📋 Records</p>
            </div>
            <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{formatNumber(previewReport.summary?.avgEmission)}</p>
              <p className="text-xs text-carbon-500 mt-1">🌍 Avg kg CO₂</p>
            </div>
          </div>

          {/* Latest Emission Breakdown */}
          {previewReport.breakdown && Object.keys(previewReport.breakdown).length > 0 && (
            <div className="mb-6">
              <h4 className="text-base font-bold text-white mb-3">Latest Emission Breakdown</h4>
              <div className="space-y-2">
                {EMISSION_CATEGORIES.map((cat) => {
                  // breakdown keys: transport, electricity, food, lifestyle
                  const breakdownKey = cat.key.replace('Emission', '');
                  const val = previewReport.breakdown[breakdownKey] || 0;
                  const total = Object.values(previewReport.breakdown).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="w-6 text-center">{cat.icon}</span>
                      <span className="text-sm text-carbon-400 w-24">{cat.label}</span>
                      <div className="flex-1 bg-carbon-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(val / total) * 100}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white w-16 text-right">{formatNumber(val)} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Goals Summary */}
          {previewReport.goals?.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base font-bold text-white mb-3">Goal Progress</h4>
              <div className="space-y-2">
                {previewReport.goals.map((goal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-carbon-800/40 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">{goal.title}</p>
                      <p className="text-xs text-carbon-500">Target: {formatNumber(goal.target)} kg CO₂</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-400">{goal.progress}%</p>
                      <p className={`text-xs capitalize ${goal.status === 'completed' ? 'text-green-400' : 'text-carbon-500'}`}>{goal.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Forecast */}
          {previewReport.prediction && (
            <div className="mb-4">
              <h4 className="text-base font-bold text-white mb-3">AI Forecast Analysis</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-purple-400">{formatNumber(previewReport.prediction.nextMonth)}</p>
                  <p className="text-xs text-carbon-500">Next Month Prediction</p>
                </div>
                <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-yellow-400 capitalize">{previewReport.prediction.trend?.direction}</p>
                  <p className="text-xs text-carbon-500">Trend Direction</p>
                </div>
                <div className="bg-carbon-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-white">{previewReport.prediction.riskLevel?.level}</p>
                  <p className="text-xs text-carbon-500">Risk Level</p>
                </div>
              </div>
              {previewReport.prediction.insights?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {previewReport.prediction.insights.map((insight, i) => (
                    <p key={i} className="text-xs text-carbon-400 flex items-start gap-2">
                      <span className="text-primary-400 mt-0.5">•</span>{insight}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-carbon-600 text-center border-t border-carbon-800 pt-4">
            Generated by CarbonWise AI · Track Today. Predict Tomorrow. Reduce Forever.
          </p>
        </motion.div>
      )}

      {/* Past Reports */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Report History</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-carbon-500">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-sm">No reports yet. Generate your first report above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report._id}
                className="flex items-center justify-between p-3 bg-carbon-800/40 rounded-xl hover:bg-carbon-800/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Sustainability Report</p>
                    <p className="text-xs text-carbon-500">{formatDate(report.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report._id)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  👁️ View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
