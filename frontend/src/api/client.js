import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export const health = () => api.get('/api/health');
export const getModels = () => api.get('/api/models');
export const getMetrics = () => api.get('/api/metrics');
export const getFeatureImportance = () => api.get('/api/feature-importance');
export const getFeatures = () => api.get('/api/features');
export const getStats = () => api.get('/api/stats');

export const predictSingle = (features, model = 'XGBoost') =>
  api.post('/api/predict/single', { features, model });

export const predictBatch = (file, model = 'XGBoost') => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/api/predict/batch?model=${model}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
