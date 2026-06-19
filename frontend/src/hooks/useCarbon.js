import { useState, useEffect } from 'react';
import { carbonAPI } from '../services/api';

/**
 * Custom hook to fetch and manage carbon data.
 */
export const useCarbon = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes] = await Promise.all([
        carbonAPI.getStats(),
        carbonAPI.getHistory({ limit: 12 }),
      ]);
      setStats(statsRes.data.data);
      setRecords(historyRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { records, stats, loading, error, refetch: fetchAll };
};

export default useCarbon;
