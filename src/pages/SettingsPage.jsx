import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getQueueCount, syncQueue, clearSynced } from '../services/offlineQueue';
import { createScan } from '../services/scanService';
import { showSuccess, showError, showInfo } from '../services/toastService';
import { APP_VERSION, DEMO_MODE, HF_SPACES_URL, SUPABASE_URL } from '../utils/constants';
import {
  Settings as SettingsIcon, RefreshCw, Trash2, Database, Wifi,
  Cpu, Info, Shield, Zap
} from 'lucide-react';

export default function SettingsPage() {
  const { operator, logout } = useAuth();
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getQueueCount().then(setQueueCount).catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncQueue(async (item) => {
        await createScan(item);
      });
      showSuccess(`Synced ${result.synced}/${result.total} items${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
      setQueueCount(await getQueueCount());
    } catch (err) {
      showError('Sync failed: ' + err.message);
    }
    setSyncing(false);
  }

  async function handleClearSynced() {
    try {
      await clearSynced();
      showSuccess('Cleared synced items from local cache');
      setQueueCount(await getQueueCount());
    } catch (err) {
      showError('Failed: ' + err.message);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and offline management</p>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 700 }}>
        {/* Operator info */}
        <div className="glass-card no-hover">
          <h3 className="flex items-center gap-8 mb-16" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Shield size={16} /> OPERATOR
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoItem label="ID" value={operator.id} />
            <InfoItem label="Name" value={operator.name} />
            <InfoItem label="Role" value={operator.role} />
            <InfoItem label="Session" value="Active" color="green" />
          </div>
        </div>

        {/* Offline queue */}
        <div className="glass-card no-hover">
          <h3 className="flex items-center gap-8 mb-16" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Database size={16} /> OFFLINE QUEUE
          </h3>
          <div className="flex items-center justify-between mb-16">
            <div>
              <span className="font-heading" style={{ fontSize: 28, fontWeight: 700, color: queueCount > 0 ? 'var(--yellow)' : 'var(--green)' }}>
                {queueCount}
              </span>
              <span className="text-sm text-dim" style={{ marginLeft: 8 }}>items pending sync</span>
            </div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing || queueCount === 0}>
              <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleClearSynced}>
              <Trash2 size={16} /> Clear Synced
            </button>
          </div>
        </div>

        {/* System info */}
        <div className="glass-card no-hover">
          <h3 className="flex items-center gap-8 mb-16" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Info size={16} /> SYSTEM INFO
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoItem label="App Version" value={`v${APP_VERSION}`} />
            <InfoItem label="Demo Mode" value={DEMO_MODE ? 'ON' : 'OFF'} color={DEMO_MODE ? 'yellow' : 'green'} />
            <InfoItem label="Backend" value={HF_SPACES_URL.replace('https://', '')} />
            <InfoItem label="Database" value={SUPABASE_URL.replace('https://', '').split('.')[0]} />
            <InfoItem label="Online" value={navigator.onLine ? 'Yes' : 'No'} color={navigator.onLine ? 'green' : 'red'} />
            <InfoItem label="PWA Installed" value={window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Tech stack */}
        <div className="glass-card no-hover">
          <h3 className="flex items-center gap-8 mb-16" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Cpu size={16} /> TECH STACK
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'React 18', 'Vite 6', 'ONNX Runtime Web', 'TensorFlow',
              'EfficientNet-B4', 'MobileNetV3', 'Grad-CAM', 'MC Dropout',
              'Supabase', 'IndexedDB', 'jsPDF', 'CLAHE', 'ExifReader',
              'HuggingFace Spaces', 'PWA', 'Federated Learning',
            ].map(tech => (
              <span key={tech} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.1)'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass-card no-hover" style={{ borderColor: 'rgba(255,51,85,0.15)' }}>
          <h3 className="flex items-center gap-8 mb-16" style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>
            <Zap size={16} /> DANGER ZONE
          </h3>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Are you sure you want to logout?')) logout();
          }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, color }) {
  return (
    <div style={{ padding: 10, background: 'var(--bg-card)', borderRadius: 8 }}>
      <div className="text-xs text-dim" style={{ marginBottom: 2 }}>{label}</div>
      <div className="font-mono text-sm" style={{ color: color ? `var(--${color})` : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
