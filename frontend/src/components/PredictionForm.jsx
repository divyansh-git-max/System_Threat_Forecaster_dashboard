import { useEffect, useState } from 'react';
import { getFeatures, getModels, predictSingle } from '../api/client';

const BOOL_LABELS = { 0: 'No', 1: 'Yes' };

export default function PredictionForm() {
  const [features, setFeatures] = useState([]);
  const [models, setModels]     = useState([]);
  const [selModel, setSelModel] = useState('XGBoost');
  const [form, setForm]         = useState({});
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([getFeatures(), getModels()]).then(([f, m]) => {
      const feats = f.data.features;
      setFeatures(feats);
      setModels(m.data.models);
      // Init defaults
      const defaults = {};
      feats.forEach((ft) => { defaults[ft.name] = ft.default; });
      setForm(defaults);
    });
  }, []);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await predictSingle(form, selModel);
      setResult(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaults = {};
    features.forEach((ft) => { defaults[ft.name] = ft.default; });
    setForm(defaults);
    setResult(null);
    setError('');
  };

  return (
    <div className="main-content animate-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h1>⚡ Single System Prediction</h1>
          <p className="page-header__sub">Enter system telemetry to predict malware detection risk</p>
        </div>
        <span className="badge badge-primary">Live Inference</span>
      </div>

      {/* Model selector */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select Model
          </span>
          <div className="model-select-wrapper">
            {models.map((m) => (
              <button
                key={m}
                className={`model-chip ${selModel === m ? 'selected' : ''}`}
                onClick={() => { setSelModel(m); setResult(null); }}
              >{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`result-card ${result.prediction === 1 ? 'result-card--threat' : 'result-card--safe'}`}>
          <div className="result-icon">{result.prediction === 1 ? '🚨' : '✅'}</div>
          <div>
            <div className="result-label" style={{ color: result.prediction === 1 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
              {result.label}
            </div>
            <div className="result-confidence">
              Model: <strong>{result.model}</strong> &nbsp;|&nbsp;
              Confidence: <strong className="mono">{(result.confidence * 100).toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', padding: '1rem 1.5rem', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Group 1: Platform / OS */}
        <FeatureGroup title="🖥 Platform & OS Settings" features={features.slice(0, 6)} form={form} onChange={handleChange} />
        {/* Group 2: Hardware */}
        <FeatureGroup title="💾 Hardware Configuration" features={features.slice(6, 15)} form={form} onChange={handleChange} style={{ marginTop: '1.25rem' }} />
        {/* Group 3: Security */}
        <FeatureGroup title="🔒 Security & Identity" features={features.slice(15)} form={form} onChange={handleChange} style={{ marginTop: '1.25rem' }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Predicting…</> : '⚡ Run Prediction'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>↺ Reset Defaults</button>
        </div>
      </form>
    </div>
  );
}

function FeatureGroup({ title, features, form, onChange, style }) {
  return (
    <div className="card" style={style}>
      <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
      <div className="grid-3">
        {features.map((ft) => (
          <FeatureInput key={ft.name} feat={ft} value={form[ft.name]} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function FeatureInput({ feat, value, onChange }) {
  const { name, label, type, min, max, options } = feat;

  if (type === 'bool') {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <div className="model-select-wrapper" style={{ gap: '0.5rem' }}>
          {[0, 1].map((v) => (
            <button
              type="button"
              key={v}
              className={`model-chip ${Number(value) === v ? 'selected' : ''}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={() => onChange(name, v)}
            >{BOOL_LABELS[v]}</button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <select
          id={name}
          className="form-select"
          value={value ?? ''}
          onChange={(e) => onChange(name, e.target.value)}
        >
          {options.map((o) => <option key={o} value={o}>{o || '(empty)'}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        type="number"
        className="form-input"
        value={value ?? min ?? 0}
        min={min}
        max={max}
        step={type === 'float' ? 0.1 : 1}
        onChange={(e) => onChange(name, type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
      />
    </div>
  );
}
