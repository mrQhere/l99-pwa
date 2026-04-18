import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { OPERATORS, HF_SPACES_URL } from './utils/constants';
import { onToast } from './services/toastService';
import {
  LayoutDashboard, ScanLine, Users, UserCog, History, FileText,
  BarChart3, Settings, LogOut, Menu, X, WifiOff, Eye
} from 'lucide-react';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import ResultsPage from './pages/ResultsPage';
import PatientsPage from './pages/PatientsPage';
import PeoplePage from './pages/PeoplePage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Auth context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Scan result context (pass between scan → results → report)
const ScanContext = createContext(null);
export const useScanResult = () => useContext(ScanContext);

export default function App() {
  const [operator, setOperator] = useState(() => {
    const saved = localStorage.getItem('l99_operator');
    return saved ? JSON.parse(saved) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setBackendStatus('offline');
      return;
    }
    const checkBackend = async () => {
      try {
        const res = await fetch(HF_SPACES_URL + '/api/health');
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('error');
      } catch {
        setBackendStatus('error');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Online/offline detection & PWA install prompt
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Toast listener
  useEffect(() => {
    return onToast((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration || 4000);
    });
  }, []);

  const login = (id) => {
    const op = { id, ...OPERATORS[id] };
    setOperator(op);
    localStorage.setItem('l99_operator', JSON.stringify(op));
  };

  const logout = () => {
    setOperator(null);
    localStorage.removeItem('l99_operator');
  };

  if (!operator) {
    return (
      <AuthContext.Provider value={{ operator, login, logout }}>
        <div className="particle-bg" />
        <LoginPage />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ operator, login, logout }}>
      <ScanContext.Provider value={{ scanResult, setScanResult }}>
        <div className="particle-bg" />

        {/* PWA Install Banner */}
        {showInstallPrompt && (
          <div className="pwa-install-banner">
            <Eye size={20} className="text-cyan" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>GET EYE SCAN APP</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Fast, offline diagnostics</div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 20 }} onClick={async () => {
              const promptEvent = window.deferredPrompt;
              if (promptEvent) {
                promptEvent.prompt();
                const { outcome } = await promptEvent.userChoice;
                if (outcome === 'accepted') setShowInstallPrompt(false);
              }
            }}>Install</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowInstallPrompt(false)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span className="toast-message">{t.message}</span>
              <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div className="offline-banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, borderRadius: 0, margin: 0 }}>
            <WifiOff size={16} />
            <span>You're offline — scans will use local MobileNetV3 model. Results queued for sync.</span>
          </div>
        )}

        {/* Mobile header */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="font-heading text-cyan" style={{ fontSize: 16, fontWeight: 700 }}>Eye Scan</span>
          <StatusBadge status={backendStatus} />
        </div>

        {/* Mobile overlay */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        <div className="app-layout">
          {/* Sidebar */}
          <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">EYE</div>
              <div>
                <div className="sidebar-logo-text">Eye Scan</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Ophthalmic AI</div>
              </div>
            </div>
            <div style={{ marginBottom: 24, padding: '0 12px' }}>
              <StatusBadge status={backendStatus} />
            </div>

            <nav className="sidebar-nav">
              <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/scan" icon={<ScanLine size={20} />} label="New Scan" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/patients" icon={<Users size={20} />} label="Patients" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/people" icon={<UserCog size={20} />} label="People" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/history" icon={<History size={20} />} label="Scan History" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/analytics" icon={<BarChart3 size={20} />} label="Analytics" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" onClick={() => setSidebarOpen(false)} />
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-user">
                <div className="sidebar-user-avatar">{operator.id}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{operator.name}</div>
                  <div className="sidebar-user-role">{operator.role}</div>
                </div>
              </div>
              <button className="nav-link mt-8" onClick={logout} style={{ color: 'var(--red)' }}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="app-main">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            <footer style={{ marginTop: 'auto', padding: '40px 20px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: 'var(--cyan)', opacity: 0.8 }}>
                L99 EYE SCAN SYSTEM
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                Ophthalmic Intelligence for Global Accessibility
              </div>
              <div style={{ marginTop: 20, fontSize: 14, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: 2 }}>
                We are here to help
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 20 }}>
                {['Support', 'Privacy', 'Compliance', 'Research'].map(link => (
                  <span key={link} style={{ fontSize: 10, color: 'var(--text-dim)', cursor: 'pointer' }}>{link}</span>
                ))}
              </div>
            </footer>
          </main>
        </div>
      </ScanContext.Provider>
    </AuthContext.Provider>
  );
}

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function StatusBadge({ status }) {
  const meta = {
    online: { color: 'var(--green)', text: 'Cloud AI Online' },
    error: { color: 'var(--yellow)', text: 'Local Mode (Cloud wait)' },
    offline: { color: 'var(--red)', text: 'Offline (Local AI)' },
    checking: { color: 'var(--text-dim)', text: 'Checking connection...' },
  }[status];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,  color: meta.color, fontWeight: 600, padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 12, border: `1px solid ${meta.color}40`, whiteSpace: 'nowrap' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}`, animation: status === 'checking' ? 'pulse 1s infinite' : 'none' }} />
      {meta.text}
    </div>
  );
}
