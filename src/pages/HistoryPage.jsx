import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScans, deleteScan } from '../services/scanService';
import { exportToCSV, SCAN_COLUMNS } from '../services/csvExport';
import { generateReport } from '../services/reportGenerator';
import { showSuccess, showError } from '../services/toastService';
import { History, Download, Trash2, Eye, FileText, Search } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadScans(); }, []);

  async function loadScans() {
    setLoading(true);
    try { setScans(await getScans({ limit: 100 })); } catch { showError('Failed to load history'); }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this scan record?')) return;
    try {
      await deleteScan(id);
      showSuccess('Scan deleted');
      loadScans();
    } catch (err) { showError('Failed: ' + err.message); }
  }

  async function handleGeneratePDF(s) {
    try {
      const filename = await generateReport({
        scan: s,
        patient: s.patients || { name: 'Not specified' },
        heatmapBase64: s.heatmap_base64,
        originalImageBase64: s.image_thumbnail,
      });
      showSuccess(`Report saved: ${filename}`);
    } catch (err) {
      showError('Failed to generate report: ' + err.message);
    }
  }

  const filtered = filter === 'all' ? scans :
    filter === 'urgent' ? scans.filter(s => s.triage === 'Urgent' || s.triage === 'Emergency') :
    filter === 'offline' ? scans.filter(s => s.is_offline) : scans;

  const severityColors = ['var(--green)', 'var(--cyan)', 'var(--yellow)', 'var(--magenta)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">{scans.length} total scans</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(scans, 'l99_scans.csv', SCAN_COLUMNS)}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="tabs">
        {[
          { key: 'all', label: 'All Scans' },
          { key: 'urgent', label: 'Urgent/Emergency' },
          { key: 'offline', label: 'Offline Scans' },
        ].map(t => (
          <button key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dna-spinner"><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <History size={48} />
            <h3 className="empty-state-title">No scan history</h3>
            <p className="empty-state-text">Completed scans will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card no-hover" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Grade</th>
                <th>Confidence</th>
                <th>Triage</th>
                <th>Model</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="text-sm font-mono">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{s.patients?.name || '—'}</td>
                  <td style={{ color: severityColors[s.severity_grade] || 'var(--text-primary)' }}>
                    {s.diagnosis}
                  </td>
                  <td>
                    <span className={`severity-badge severity-${s.severity_grade}`}>
                      G{s.severity_grade}
                    </span>
                  </td>
                  <td className="font-mono text-sm">{s.confidence ? (s.confidence * 100).toFixed(1) + '%' : '—'}</td>
                  <td>
                    <span className={`triage-${(s.triage || '').toLowerCase()}`} style={{ fontWeight: 600, fontSize: 13 }}>
                      {s.triage || '—'}
                    </span>
                  </td>
                  <td className="text-xs text-dim">{s.is_offline ? '📱 Offline' : '☁️ Online'}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleGeneratePDF(s)} title="Download PDF Report">
                        <FileText size={14} className="text-cyan" />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)} title="Delete">
                        <Trash2 size={14} className="text-red" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
