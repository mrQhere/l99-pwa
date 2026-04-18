import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScanResult } from '../App';
import { CLASS_NAMES, SEVERITY_LABELS } from '../utils/constants';
import {
  FileText, Share2, ArrowLeft, AlertTriangle, CheckCircle, Shield, Zap
} from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { scanResult } = useScanResult();
  const { id } = useParams();

  const result = scanResult;

  if (!result) {
    return (
      <div className="fade-in">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <AlertTriangle size={48} />
          <h3 className="empty-state-title">No Results Available</h3>
          <p className="empty-state-text">Run a scan first to see diagnostic results.</p>
          <button className="btn btn-primary mt-24" onClick={() => navigate('/scan')}>
            <Zap size={18} /> Start New Scan
          </button>
        </div>
      </div>
    );
  }

  const severityColors = ['var(--green)', 'var(--cyan)', 'var(--yellow)', 'var(--magenta)', 'var(--red)'];
  const diagColor = severityColors[result.severity_grade] || severityColors[0];
  const triageColors = { Routine: 'green', Priority: 'yellow', Urgent: 'magenta', Emergency: 'red' };

  return (
    <div className="fade-in">
      <div className="page-header flex items-center gap-16">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">Diagnostic Results</h1>
          <p className="page-subtitle">
            {result.demo_mode && <span className="text-yellow">[DEMO MODE] </span>}
            {result.is_offline && <span className="text-yellow">[OFFLINE] </span>}
            Analysis complete
          </p>
        </div>
      </div>

      <div className="results-grid">
        {/* Left column — Diagnosis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main diagnosis card */}
          <div className="glass-card">
            <div className="flex items-center gap-8 mb-16">
              <Shield size={20} style={{ color: diagColor }} />
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Diagnosis</span>
            </div>
            <h2 className="result-diagnosis" style={{ color: diagColor }}>
              {result.diagnosis}
            </h2>
            <div className={`severity-badge severity-${result.severity_grade}`}>
              {SEVERITY_LABELS[result.severity_grade]}
            </div>

            <div className="result-meta mt-24">
              <div className="result-meta-row">
                <span className="result-meta-label">Confidence</span>
                <span className="result-meta-value">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: -4, marginBottom: 8 }}>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${result.confidence * 100}%` }} />
                </div>
              </div>

              {result.uncertainty >= 0 && (
                <div className="result-meta-row">
                  <span className="result-meta-label">Uncertainty (MC Dropout)</span>
                  <span className="result-meta-value" style={{ color: result.uncertainty > 0.15 ? 'var(--yellow)' : 'var(--green)' }}>
                    {result.uncertainty.toFixed(4)}
                  </span>
                </div>
              )}

              <div className="result-meta-row">
                <span className="result-meta-label">Model</span>
                <span className="result-meta-value text-xs">{result.model_used}</span>
              </div>

              {result.quality && (
                <div className="result-meta-row">
                  <span className="result-meta-label">Image Quality</span>
                  <span className="result-meta-value">{result.quality.qualityWeight.toFixed(3)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Triage card */}
          <div className="glass-card" style={{ borderLeft: `3px solid var(--${triageColors[result.triage] || 'cyan'})` }}>
            <div className="flex items-center gap-8 mb-16">
              <AlertTriangle size={18} style={{ color: `var(--${triageColors[result.triage] || 'cyan'})` }} />
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Triage</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: `var(--${triageColors[result.triage] || 'cyan'})`, marginBottom: 8 }}>
              {result.triage}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              {result.triage_action}
            </p>
            <p className="text-xs text-dim">{result.triage_timeframe}</p>
          </div>

          {/* Medical Insights card */}
          <div className="glass-card">
            <div className="flex items-center gap-8 mb-16">
              <CheckCircle size={18} className="text-cyan" />
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Medical Insights</span>
            </div>
            <div className="text-sm" style={{ lineHeight: 1.6 }}>
              {result.severity_grade === 0 && "Your retina appears healthy with no visible signs of retinopathy or vascular distress."}
              {result.severity_grade >= 1 && result.severity_grade <= 4 && "Signs of Diabetic Retinopathy detected. This can lead to vision loss if blood sugar is not controlled. Microaneurysms or hemorrhages may be present."}
              {result.severity_grade === 5 && "Clouding of the lens (Cataract) detected. This typically requires surgical consultation for restoration of clear vision."}
              {result.severity_grade === 6 && "Optic nerve excavation or changes suggestive of Glaucoma detected. Early treatment is vital to prevent permanent peripheral vision loss."}
              {result.severity_grade === 7 && "Macular changes associated with Aging (AMD) detected. This affects central vision and requires immediate dietary or medical intervention."}
              {result.severity_grade === 8 && "Significant retinal vascular changes detected. This is often a sign of high blood pressure (Hypertensive Crisis). Seek medical evaluation for systemic health."}
            </div>
          </div>

          {/* Class probabilities */}
          <div className="glass-card">
            <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Class Probabilities
            </span>
            <div className="prob-list mt-16">
              {CLASS_NAMES.map((name, i) => {
                const prob = result.probabilities?.[i] || 0;
                return (
                  <div key={name} className="prob-item">
                    <div className="prob-header">
                      <span className="prob-name">{name}</span>
                      <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="prob-bar">
                      <div
                        className={`prob-fill ${prob > 0.3 ? 'high' : prob > 0.1 ? 'medium' : 'low'}`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — Heatmap + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Heatmap */}
          {result.heatmap_base64 ? (
            <div className="glass-card">
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>
                Grad-CAM Activation Map
              </span>
              <div className="heatmap-container">
                <img
                  className="heatmap-img"
                  src={`data:image/png;base64,${result.heatmap_base64}`}
                  alt="Grad-CAM heatmap showing regions of interest"
                />
                <div className="heatmap-label">Grad-CAM</div>
              </div>
              <p className="text-xs text-dim mt-8">
                Highlighted regions indicate areas the model focused on for diagnosis
              </p>
            </div>
          ) : (
            <div className="glass-card">
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>
                Grad-CAM
              </span>
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <p className="text-sm text-dim">
                  {result.is_offline
                    ? 'Connect for visual analysis — heatmap requires server-side processing'
                    : 'Heatmap not available in demo mode'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="glass-card">
            <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, display: 'block' }}>
              Actions
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/report')}>
                <FileText size={18} /> Generate PDF Report
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => {
                const text = `Eye Scan Result: ${result.diagnosis} (Grade ${result.severity_grade}). Confidence: ${(result.confidence * 100).toFixed(1)}%. Triage: ${result.triage}.`;
                if (navigator.share) {
                  navigator.share({ title: 'Eye Scan Result', text: text }).catch(console.error);
                } else {
                  window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
                }
              }}>
                <Share2 size={18} /> Share via WhatsApp
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/scan')}>
                New Scan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
