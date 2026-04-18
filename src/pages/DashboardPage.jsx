import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getPatientCount } from '../services/patientService';
import { getScanCount, getRecentStats } from '../services/scanService';
import { getPeopleCount } from '../services/peopleService';
import { getQueueCount } from '../services/offlineQueue';
import {
  ScanLine, Users, Activity, AlertTriangle, Clock, ArrowRight,
  Eye, TrendingUp, Wifi, WifiOff
} from 'lucide-react';

export default function DashboardPage() {
  const { operator } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0, scans: 0, people: 0, queued: 0,
    weekScans: 0, urgentScans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // For restricted operators, stats should only reflect THEIR work
      const filters = !operator.isMaster ? { operatorId: operator.id } : {};
      
      const [patients, scans, queued, recent] = await Promise.all([
        getPatientCount(filters).catch(() => 0),
        getScanCount(filters).catch(() => 0),
        getQueueCount().catch(() => 0),
        getRecentStats(filters).catch(() => ({ thisWeek: 0, urgent: 0 })),
      ]);
      
      setStats({
        patients, scans, queued,
        weekScans: recent.thisWeek,
        urgentScans: recent.urgent,
      });
    } catch (e) {
      console.warn('Stats load error:', e);
    }
    setLoading(false);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, {operator.name} — Operator {operator.id}
        </p>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/scan')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon cyan"><ScanLine size={20} /></div>
            {isOnline ? <Wifi size={14} style={{ color: 'var(--green)' }} /> : <WifiOff size={14} style={{ color: 'var(--yellow)' }} />}
          </div>
          <div className="stat-card-value">{stats.scans}</div>
          <div className="stat-card-label">Total Scans</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/patients')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon green"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{stats.patients}</div>
          <div className="stat-card-label">Patients</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon magenta"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-card-value">{stats.urgentScans}</div>
          <div className="stat-card-label">Urgent Cases (7d)</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon yellow"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">{stats.queued}</div>
          <div className="stat-card-label">Queued Offline</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/scan')}>
          <div className="flex items-center gap-16">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--cyan), var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={28} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>New Retinal Scan</h3>
              <p className="text-sm text-dim">Capture or upload a fundus image for AI analysis</p>
            </div>
            <ArrowRight size={20} className="text-cyan" />
          </div>
        </div>

        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patients')}>
          <div className="flex items-center gap-16">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} style={{ color: 'var(--green)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Register Patient</h3>
              <p className="text-sm text-dim">Add new patient demographics to the system</p>
            </div>
            <ArrowRight size={20} className="text-cyan" />
          </div>
        </div>

        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/analytics')}>
          <div className="flex items-center gap-16">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--magenta-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={28} style={{ color: 'var(--magenta)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>View Analytics</h3>
              <p className="text-sm text-dim">Severity distribution and scan trends</p>
            </div>
            <ArrowRight size={20} className="text-cyan" />
          </div>
        </div>
      </div>

      {/* Diagnostic Logic Oversight */}
      <div className="glass-card mb-24 no-hover">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Diagnostic Logic Distribution
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Retinopathy', color: 'var(--cyan)', val: 'Primary' },
            { label: 'Cataract', color: 'var(--magenta)', val: 'Integrated' },
            { label: 'Glaucoma', color: 'var(--green)', val: 'Active' },
            { label: 'AMD', color: 'var(--yellow)', val: 'Active' },
            { label: 'vascular', color: 'var(--red)', val: 'Emergency' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${item.color}20` }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System status */}
      <div className="glass-card no-hover">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
          SYSTEM STATUS
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <StatusItem label="Cloud Network" status={isOnline ? 'Active' : 'Offline'} color={isOnline ? 'green' : 'yellow'} />
          <StatusItem label="Offline Engine" status="Ready" color="green" />
          <StatusItem label="Database" status={isOnline ? 'Connected' : 'Local Cache'} color={isOnline ? 'green' : 'yellow'} />
          <StatusItem label="Diagnostic Wave" status="New Wave (Multi-Headed)" color="cyan" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }) {
  return (
    <div className="flex items-center gap-8">
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: `var(--${color})`,
        boxShadow: `0 0 8px var(--${color})`,
      }} />
      <span className="text-sm text-dim">{label}:</span>
      <span className="text-sm font-mono" style={{ color: `var(--${color})` }}>{status}</span>
    </div>
  );
}
