import { useRef, useState } from 'react';
import { getModels, predictBatch } from '../api/client';
import { useEffect } from 'react';

export default function BatchUpload() {
  const [models, setModels]     = useState([]);
  const [selModel, setSelModel] = useState('XGBoost');
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef = useRef();

  useEffect(() => {
    getModels().then((r) => setModels(r.data.models));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) { setFile(f); setResult(null); setError(''); }
    else setError('Please upload a .csv file.');
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await predictBatch(file, selModel);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Batch prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setFile(null); setResult(null); setError(''); };

  return (
    <div className="main-content animate-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h1>⬆ Batch Analysis</h1>
          <p className="page-header__sub">Upload a CSV file with system telemetry for bulk prediction</p>
        </div>
        <span className="badge badge-info">CSV Upload</span>
      </div>

      {/* Model selector */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Model</span>
          <div className="model-select-wrapper">
            {models.map((m) => (
              <button key={m} className={`model-chip ${selModel === m ? 'selected' : ''}`}
                onClick={() => { setSelModel(m); setResult(null); }}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" hidden onChange={handleFile} />
          <div className="drop-zone__icon">{file ? '📄' : '⬆'}</div>
          <div className="drop-zone__title">
            {file ? file.name : 'Drop your CSV file here'}
          </div>
          <div className="drop-zone__sub">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · Click to change`
              : 'or click to browse · CSV files only'}
          </div>
          {file && (
            <div style={{ marginTop: '1rem' }}>
              <span className="badge badge-primary">File selected</span>
            </div>
          )}
        </div>
      )}

      {/* CSV template hint */}
      {!result && (
        <div className="card" style={{ padding: '1rem 1.5rem', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.12)' }}>
          <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>📋 Expected CSV Columns</h4>
          <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.8, wordBreak: 'break-all' }}>
            OsBuild, OsSuite, IeVerIdentifier, SmartScreen, Firewall, UacLuaSettings,
            Census_ProcessorCoreCount, Census_PrimaryDiskTotalCapacity, Census_SystemVolumeTotalCapacity,
            Census_TotalPhysicalRAM, Census_HasOpticalDiskDrive, Census_InternalPrimaryDiagonalDisplaySizeInInches,
            Census_InternalPrimaryDisplayResolutionHorizontal, Census_InternalPrimaryDisplayResolutionVertical,
            Census_InternalBatteryNumberOfCharges, Census_IsSecureBootEnabled, Census_IsVirtualDevice,
            Census_IsTouchEnabled, Census_IsAlwaysOnAlwaysConnectedCapable, Wdft_IsGamer, CountryIdentifier, LocaleEnglishNameIdentifier
          </p>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', padding: '1rem 1.5rem', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Actions */}
      {!result && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!file || loading} style={{ minWidth: 180 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analysing…</> : '🔍 Run Batch Analysis'}
          </button>
          {file && <button className="btn btn-secondary" onClick={handleReset}>✕ Clear</button>}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary cards */}
          <div className="grid-4">
            <div className="card metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">Total Records</span>
                <div className="metric-card__icon" style={{ background: 'rgba(99,102,241,0.2)' }}>📦</div>
              </div>
              <div className="metric-card__value" style={{ color: 'var(--accent-primary)' }}>{result.total}</div>
              <div className="metric-card__sub">Processed by {selModel}</div>
            </div>
            <div className="card metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">Threats Found</span>
                <div className="metric-card__icon" style={{ background: 'rgba(244,63,94,0.2)' }}>🚨</div>
              </div>
              <div className="metric-card__value" style={{ color: 'var(--accent-danger)' }}>{result.threats}</div>
              <div className="metric-card__sub">Malware detected</div>
            </div>
            <div className="card metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">Safe Systems</span>
                <div className="metric-card__icon" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</div>
              </div>
              <div className="metric-card__value" style={{ color: 'var(--accent-success)' }}>{result.safe}</div>
              <div className="metric-card__sub">No threat detected</div>
            </div>
            <div className="card metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">Threat Rate</span>
                <div className="metric-card__icon" style={{ background: 'rgba(245,158,11,0.2)' }}>📈</div>
              </div>
              <div className="metric-card__value" style={{ color: 'var(--accent-warning)' }}>
                {(result.threat_rate * 100).toFixed(1)}%
              </div>
              <div className="metric-card__sub">Of total records</div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${result.threat_rate * 100}%`, background: 'var(--accent-danger)' }} />
              </div>
            </div>
          </div>

          {/* Results table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>📋 Prediction Results</h3>
              <button className="btn btn-secondary" onClick={handleReset} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                ↺ New Upload
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Row #</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.slice(0, 100).map((r) => (
                    <tr key={r.row}>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>#{r.row}</td>
                      <td><strong style={{ color: r.prediction === 1 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{r.label}</strong></td>
                      <td className="mono">{(r.confidence * 100).toFixed(1)}%</td>
                      <td>
                        <span className={`badge ${r.prediction === 1 ? 'badge-danger' : 'badge-success'}`}>
                          {r.prediction === 1 ? '🚨 Threat' : '✅ Safe'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.results.length > 100 && (
                <p style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Showing first 100 of {result.results.length} records
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
