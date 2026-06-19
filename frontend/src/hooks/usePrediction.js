import { useState, useEffect } from 'react';
import { predictionsAPI } from '../services/api';

/**
 * Custom hook to fetch the latest AI prediction.
 */
export const usePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictionsAPI.getLatest();
      setPrediction(res.data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await predictionsAPI.generate();
      setPrediction(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLatest(); }, []);

  return { prediction, loading, error, generate, refetch: fetchLatest };
};

export default usePrediction;
