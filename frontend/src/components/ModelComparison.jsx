import { useEffect, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getMetrics } from '../api/client';

const FMT = (v) => `${(v * 100).toFixed(1)}%`;

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

const METRICS_DISPLAY = [
  { key: 'accuracy',    label: 'Accuracy',     color: '#6366f1' },
  { key: 'precision_1', label: 'Precision (1)', color: '#22d3ee' },
  { key: 'recall_1',    label: 'Recall (1)',    color: '#10b981' },
  { key: 'f1_1',        label: 'F1 (1)',        color: '#f59e0b' },
];

export default function ModelComparison() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetrics()
      .then((r) => setMetrics(r.data.metrics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="main-content"><div className="loader"><div className="spinner" /><span>Loading…</span></div></div>
  );

  // Radar data
  const radarData = [
    { metric: 'Accuracy',    ...Object.fromEntries(metrics.map((m) => [m.model, m.accuracy])) },
    { metric: 'Precision 1', ...Object.fromEntries(metrics.map((m) => [m.model, m.precision_1])) },
    { metric: 'Recall 1',    ...Object.fromEntries(metrics.map((m) => [m.model, m.recall_1])) },
    { metric: 'F1 1',        ...Object.fromEntries(metrics.map((m) => [m.model, m.f1_1])) },
    { metric: 'Precision 0', ...Object.fromEntries(metrics.map((m) => [m.model, m.precision_0])) },
    { metric: 'Recall 0',    ...Object.fromEntries(metrics.map((m) => [m.model, m.recall_0])) },
  ];

  return (
    <div className="main-content animate-in">
      <div className="page-header">
        <div className="page-header__title">
          <h1>🧠 Model Comparison</h1>
          <p className="page-header__sub">Side-by-side performance analysis of all {metrics.length} trained models</p>
        </div>
      </div>

      {/* Grouped bar chart */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>📊 Metrics Grouped by Model</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="model" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-20} textAnchor="end" tickLine={false} />
            <YAxis domain={[0.55, 0.70]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.5rem' }} />
            {METRICS_DISPLAY.map(({ key, label, color }) => (
              <Bar key={key} dataKey={key} name={label} fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>🕸 Radar: All Models</h3>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(99,102,241,0.15)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0.55, 0.70]} tick={false} axisLine={false} />
            {metrics.map((m) => (
              <Radar key={m.model} name={m.model} dataKey={m.model}
                stroke={m.color} fill={m.color} fillOpacity={0.08} strokeWidth={2} />
            ))}
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-model detail cards */}
      <div className="grid-3">
        {metrics.map((m) => (
          <div className="card" key={m.model}
            style={{ borderColor: `${m.color}33`, background: `linear-gradient(135deg, ${m.color}08, transparent)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ color: m.color }}>{m.model}</h4>
                <span className="badge" style={{ marginTop: '0.25rem', background: `${m.color}22`, color: m.color, borderColor: `${m.color}44` }}>
                  {FMT(m.accuracy)} Accuracy
                </span>
              </div>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
            </div>

            {[
              { label: 'Precision (Class 0)', val: m.precision_0 },
              { label: 'Precision (Class 1)', val: m.precision_1 },
              { label: 'Recall (Class 0)',    val: m.recall_0 },
              { label: 'Recall (Class 1)',    val: m.recall_1 },
              { label: 'F1-Score (Class 0)', val: m.f1_0 },
              { label: 'F1-Score (Class 1)', val: m.f1_1 },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{FMT(val)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${val * 100}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
