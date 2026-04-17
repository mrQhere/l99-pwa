import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { OPERATORS } from '../utils/constants';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 1800));

    const op = OPERATORS[operatorId];
    if (!op || password !== op.password) {
      setError('Invalid credentials');
      setLoading(false);
      return;
    }

    login(operatorId);
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      {/* Animated background rings */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', overflow: 'hidden'
      }}>
        {[400, 500, 600, 700].map((size, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: `1px solid rgba(0, 240, 255, ${0.04 - i * 0.008})`,
            animation: `spinRing ${20 + i * 8}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
          }} />
        ))}
      </div>

      <div className="login-container" style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div className="login-card">
          {/* Logo animation */}
          <div className="login-logo">
            <div style={{
              position: 'relative', width: 80, height: 80, margin: '0 auto 20px',
            }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: 'var(--cyan)',
                animation: 'spinRing 3s linear infinite',
              }} />
              {/* Middle ring */}
              <div style={{
                position: 'absolute', inset: 10, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: 'var(--magenta)',
                animation: 'spinRing 2s linear infinite reverse',
              }} />
              {/* Inner dot */}
              <div style={{
                position: 'absolute', inset: 22, borderRadius: '50%',
                background: loading
                  ? 'conic-gradient(from 0deg, var(--cyan), var(--magenta), var(--cyan))'
                  : 'linear-gradient(135deg, var(--cyan), var(--magenta))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 900, color: '#000',
                animation: loading ? 'spinRing 1s linear infinite' : 'logoPulse 3s ease-in-out infinite',
              }}>
                L99
              </div>
            </div>
            <h1 className="login-title" style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.6s ease 0.3s',
            }}>L99</h1>
            <p className="login-subtitle" style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.6s ease 0.5s',
            }}>Ophthalmic Diagnostic System</p>
          </div>

          {error && (
            <div className="login-error" style={{ animation: 'fadeIn 0.3s ease' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.6s ease 0.4s',
          }}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-op-id">Operator ID</label>
              <input
                id="login-op-id"
                className="input-field"
                type="text"
                placeholder="Enter your ID"
                value={operatorId}
                onChange={(e) => { setOperatorId(e.target.value.trim()); setError(''); }}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-pw">Password</label>
              <input
                id="login-pw"
                className="input-field"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !operatorId || !password}
              style={{
                marginTop: 24,
                position: 'relative',
                width: '100%',
                padding: '16px 24px',
                background: loading ? 'transparent' : 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: loading || !operatorId || !password ? 'not-allowed' : 'pointer',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: (operatorId && password && !loading) ? '0 0 25px rgba(0, 240, 255, 0.2), inset 0 0 15px rgba(0, 240, 255, 0.1)' : 'none',
                opacity: (!operatorId || !password) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if(operatorId && password && !loading) {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 240, 255, 0.4), inset 0 0 20px rgba(0, 240, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if(operatorId && password && !loading) {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.2), inset 0 0 15px rgba(0, 240, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Animated glass shine effect */}
              {!loading && operatorId && password && (
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transform: 'skewX(-25deg)',
                  animation: 'shimmerSweep 4s linear infinite'
                }} />
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
                {loading ? (
                  <>
                    <span className="dna-spinner" style={{ padding: 0 }}>
                      <span className="dna-dot" style={{ width: 6, height: 6, background: 'var(--cyan)' }} />
                      <span className="dna-dot" style={{ width: 6, height: 6, background: 'var(--cyan)' }} />
                      <span className="dna-dot" style={{ width: 6, height: 6, background: 'var(--cyan)' }} />
                    </span>
                    <span style={{ color: 'var(--cyan)', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} style={{ color: 'var(--cyan)' }} />
                    <span style={{ 
                      background: 'linear-gradient(90deg, #fff, var(--cyan))', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 20px rgba(0,240,255,0.3)'
                    }}>
                      AUTHORIZE ACCESS
                    </span>
                  </>
                )}
              </div>
              <style>
                {`
                  @keyframes shimmerSweep {
                    0% { left: -100%; top: 0; }
                    20% { left: 200%; top: 0; }
                    100% { left: 200%; top: 0; }
                  }
                `}
              </style>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
