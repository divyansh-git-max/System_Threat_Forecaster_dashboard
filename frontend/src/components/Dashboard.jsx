import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { getMetrics, getStats, getFeatureImportance } from '../api/client';

const FMT = (v) => `${(v * 100).toFixed(1)}%`;

const METRIC_CARDS = [
  { key: 'best_accuracy', label: 'Best Accuracy',  icon: '🎯', color: '#6366f1', format: FMT },
  { key: 'training_samples', label: 'Train Samples', icon: '📦', color: '#22d3ee', format: (v) => (v / 1e6).toFixed(1) + 'M' },
  { key: 'features_used', label: 'Features Used',  icon: '🔬', color: '#10b981', format: String },
  { key: 'classes',       label: 'Output Classes', icon: '🏷',  color: '#f59e0b', format: (v) => v.length },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.82rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || 'var(--text-primary)' }}>
          {p.name}: <strong>{(p.value * 100).toFixed(1)}%</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [metrics, setMetrics]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getMetrics(), getStats(), getFeatureImportance()])
      .then(([m, s, f]) => {
        setMetrics(m.data.metrics);
        setStats(s.data);
        setFeatures(f.data.importances.slice(0, 8));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="main-content">
      <div className="loader"><div className="spinner" /><span>Loading analytics…</span></div>
    </div>
  );

  const bestModel = metrics.reduce((best, m) => m.accuracy > (best?.accuracy ?? 0) ? m : best, null);
  const pieData   = [
    { name: 'No Threat', value: stats?.class_balance?.[0] ?? 0.49, fill: '#10b981' },
    { name: 'Threat',    value: stats?.class_balance?.[1] ?? 0.51, fill: '#f43f5e' },
  ];

  return (
    <div className="main-content animate-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h1>🛡 Threat Intelligence Dashboard</h1>
          <p className="page-header__sub">
            Microsoft Malware Prediction · {metrics.length} models · Live analysis
          </p>
        </div>
        <span className="badge badge-success">● System Online</span>
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        {stats && METRIC_CARDS.map(({ key, label, icon, color, format }) => (
          <div className="card metric-card" key={key}>
            <div className="metric-card__header">
              <span className="metric-card__label">{label}</span>
              <div className="metric-card__icon" style={{ background: `${color}22` }}>
                {icon}
              </div>
            </div>
            <div className="metric-card__value" style={{ color }}>{format(stats[key])}</div>
            <div className="metric-card__sub">
              {key === 'best_accuracy' ? `Best: ${stats.best_model}` :
               key === 'training_samples' ? 'Windows telemetry records' :
               key === 'features_used' ? `of ${stats.features_total} total features` :
               'Binary classification'}
            </div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{
                width: key === 'best_accuracy' ? `${stats[key] * 100}%` : '100%',
                background: `linear-gradient(90deg, ${color}, ${color}99)`,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid-2">
        {/* Model Accuracy Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>📈 Model Accuracy Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="model" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} />
              <YAxis domain={[0.58, 0.66]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {metrics.map((m) => <Cell key={m.model} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class Distribution */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>🍕 Class Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '1.5rem' }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, display: 'inline-block' }} />
                      {d.name}
                    </span>
                    <strong style={{ color: d.fill, fontSize: '0.9rem' }}>{(d.value * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${d.value * 100}%`, background: d.fill }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Near-balanced dataset — ideal for binary classification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature importance + Best Model */}
      <div className="grid-2">
        {/* Feature Importance */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>🔬 Top Feature Importances</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={features} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="feature" width={220} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={14}>
                {features.map((_, i) => (
                  <Cell key={i} fill={`hsl(${240 + i * 8}, 70%, ${55 + i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Model Spotlight */}
        {bestModel && (
          <div className="card" style={{ background: `linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.05))` }}>
            <h3 style={{ marginBottom: '1rem' }}>🏆 Best Performing Model</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{bestModel.model}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Highest validation accuracy</p>
              </div>

              {[
                { label: 'Accuracy', value: bestModel.accuracy },
                { label: 'Precision (Class 1)', value: bestModel.precision_1 },
                { label: 'Recall (Class 1)', value: bestModel.recall_1 },
                { label: 'F1-Score (Class 1)', value: bestModel.f1_1 },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{FMT(value)}</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{
                      width: `${value * 100}%`,
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Models Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📋 Full Model Performance Report</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision 0</th>
                <th>Precision 1</th>
                <th>Recall 0</th>
                <th>Recall 1</th>
                <th>F1 0</th>
                <th>F1 1</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.model}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, display: 'inline-block', flexShrink: 0 }} />
                      <strong>{m.model}</strong>
                    </span>
                  </td>
                  <td><span className={`badge ${m.accuracy >= 0.63 ? 'badge-success' : 'badge-warning'}`}>{FMT(m.accuracy)}</span></td>
                  <td><span className="mono">{FMT(m.precision_0)}</span></td>
                  <td><span className="mono">{FMT(m.precision_1)}</span></td>
                  <td><span className="mono">{FMT(m.recall_0)}</span></td>
                  <td><span className="mono">{FMT(m.recall_1)}</span></td>
                  <td><span className="mono">{FMT(m.f1_0)}</span></td>
                  <td><span className="mono">{FMT(m.f1_1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
