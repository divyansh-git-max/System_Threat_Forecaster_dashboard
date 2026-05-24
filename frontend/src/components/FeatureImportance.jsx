import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getFeatureImportance } from '../api/client';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.82rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4, maxWidth: 220 }}>{label}</p>
      <p style={{ color: 'var(--accent-primary)' }}>
        Importance: <strong>{(payload[0].value * 100).toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export default function FeatureImportance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeatureImportance()
      .then((r) => setData(r.data.importances))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="main-content"><div className="loader"><div className="spinner" /><span>Loading…</span></div></div>
  );

  const total = data.reduce((s, d) => s + d.importance, 0);

  return (
    <div className="main-content animate-in">
      <div className="page-header">
        <div className="page-header__title">
          <h1>📊 Feature Importance</h1>
          <p className="page-header__sub">XGBoost gain-based feature importances — top {data.length} features</p>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>🔬 Importance Scores</h3>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={[...data].reverse()} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="feature" width={280}
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {[...data].reverse().map((_, i) => (
                <Cell key={i} fill={`hsl(${220 + i * 12}, 75%, ${50 + i * 2}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature cards grid */}
      <div className="grid-auto">
        {data.map((d, i) => {
          const pct = (d.importance / total) * 100;
          const color = `hsl(${220 + i * 12}, 75%, ${55 + i * 2}%)`;
          return (
            <div className="card" key={d.feature} style={{ padding: '1rem 1.25rem', gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${color}22`, color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>#{i + 1}</span>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color }}>
                  {(d.importance * 100).toFixed(2)}%
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {d.feature}
                </p>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${pct.toFixed(1)}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
