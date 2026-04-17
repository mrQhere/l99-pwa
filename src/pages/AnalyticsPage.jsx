import React, { useState, useEffect } from 'react';
import { getSeverityDistribution, getScanCount, getRecentStats } from '../services/scanService';
import { getPatientCount } from '../services/patientService';
import { CLASS_NAMES } from '../utils/constants';
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [dist, setDist] = useState([0, 0, 0, 0, 0]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [recentStats, setRecentStats] = useState({ thisWeek: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSeverityDistribution().then(setDist).catch(() => {}),
      getScanCount().then(setTotalScans).catch(() => {}),
      getPatientCount().then(setTotalPatients).catch(() => {}),
      getRecentStats().then(setRecentStats).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const maxDist = Math.max(...dist, 1);
  const barColors = ['var(--green)', 'var(--cyan)', 'var(--yellow)', 'var(--magenta)', 'var(--red)'];
  const total = dist.reduce((a, b) => a + b, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Screening metrics and severity distribution</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon cyan"><Activity size={20} /></div>
          </div>
          <div className="stat-card-value">{totalScans}</div>
          <div className="stat-card-label">Total Scans</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{totalPatients}</div>
          <div className="stat-card-label">Total Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon yellow"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">{recentStats.thisWeek}</div>
          <div className="stat-card-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon magenta"><BarChart3 size={20} /></div>
          </div>
          <div className="stat-card-value">{recentStats.urgent}</div>
          <div className="stat-card-label">Urgent (7d)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Severity Distribution Chart */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24, color: 'var(--text-secondary)' }}>
            SEVERITY DISTRIBUTION
          </h3>
          <div className="chart-container">
            <div className="chart-bar-group">
              {dist.map((count, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="font-mono text-xs" style={{ marginBottom: 8, color: barColors[i] }}>
                    {count}
                  </span>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(count / maxDist) * 140}px`,
                      background: `linear-gradient(to top, ${barColors[i]}44, ${barColors[i]})`,
                      width: '100%',
                      border: `1px solid ${barColors[i]}44`,
                    }}
                  />
                  <span className="text-xs text-dim" style={{ marginTop: 8, textAlign: 'center', lineHeight: 1.2 }}>
                    G{i}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {CLASS_NAMES.map((name, i) => (
              <div key={i} className="flex items-center gap-8">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: barColors[i] }} />
                <span className="text-sm">{name}</span>
                <span className="text-sm text-dim font-mono" style={{ marginLeft: 'auto' }}>
                  {total > 0 ? ((dist[i] / total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24, color: 'var(--text-secondary)' }}>
            KEY METRICS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MetricRow
              label="Detection Rate"
              value={total > 0 ? `${(((total - dist[0]) / total) * 100).toFixed(1)}%` : '0%'}
              description="Percentage of scans with any DR detected"
              color="cyan"
            />
            <MetricRow
              label="Severe+ Rate"
              value={total > 0 ? `${(((dist[3] + dist[4]) / total) * 100).toFixed(1)}%` : '0%'}
              description="Percentage of scans with Grade 3 or 4"
              color="magenta"
            />
            <MetricRow
              label="Avg. Scans per Patient"
              value={totalPatients > 0 ? (totalScans / totalPatients).toFixed(1) : '0'}
              description="Average number of scans per registered patient"
              color="green"
            />
            <MetricRow
              label="Urgent Action Rate"
              value={totalScans > 0 ? `${((recentStats.urgent / Math.max(recentStats.thisWeek, 1)) * 100).toFixed(1)}%` : '0%'}
              description="Urgent or emergency cases this week"
              color="yellow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, description, color }) {
  return (
    <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, borderLeft: `3px solid var(--${color})` }}>
      <div className="flex items-center justify-between mb-8">
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: `var(--${color})` }}>{value}</span>
      </div>
      <p className="text-xs text-dim">{description}</p>
    </div>
  );
}
