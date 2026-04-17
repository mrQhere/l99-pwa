import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useScanResult } from '../App';
import { getPatients, searchPatients } from '../services/patientService';
import { getScans } from '../services/scanService';
import { supabase } from '../services/supabase';
import { applyCLAHE } from '../services/clahe';
import { parseExif } from '../services/exifParser';
import { computeQualityScore } from '../services/qualityScorer';
import { predictImage, checkBackendHealth } from '../services/api';
import { runOfflineInference } from '../services/onnxInference';
import { computeTriage } from '../services/triageLogic';
import { createScan } from '../services/scanService';
import { addToQueue } from '../services/offlineQueue';
import { showSuccess, showError, showInfo } from '../services/toastService';
import { SEVERITY_LABELS } from '../utils/constants';
import {
  Camera, Upload, RefreshCw, Zap, Search, Phone, User, History, ChevronRight
} from 'lucide-react';

export default function ScanPage() {
  const { operator } = useAuth();
  const { setScanResult } = useScanResult();
  const navigate = useNavigate();

  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [searching, setSearching] = useState(false);

  const [imageBlob, setImageBlob] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [exifData, setExifData] = useState(null);
  const [qualityData, setQualityData] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ── Phone Number Lookup ─────────────────────────────────
  async function handlePhoneSearch(value) {
    setPhoneSearch(value);
    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`contact.ilike.%${value}%,name.ilike.%${value}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error) setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function selectPatient(patient) {
    setSelectedPatient(patient);
    setSearchResults([]);
    setPhoneSearch(patient.contact || patient.name);

    // Load their scan history
    try {
      const scans = await getScans({ patientId: patient.id, limit: 5 });
      setPatientHistory(scans);
    } catch {
      setPatientHistory([]);
    }
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientHistory([]);
    setPhoneSearch('');
  }

  // ── Camera ──────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      showError('Camera access denied: ' + err.message);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function captureFromCamera() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      stopCamera();
      await handleImageSelected(blob);
    }, 'image/png');
  }

  // ── File Upload ─────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) await handleImageSelected(file);
  }

  async function handleImageSelected(blob) {
    setImageBlob(blob);
    setImagePreview(URL.createObjectURL(blob));
    try { setExifData(await parseExif(blob)); } catch { setExifData(null); }
    try { setQualityData(await computeQualityScore(blob)); } catch { setQualityData(null); }
  }

  // ── Run Analysis ────────────────────────────────────────
  async function runAnalysis() {
    if (!imageBlob) return;
    setProcessing(true);

    try {
      setProcessingStep('Applying CLAHE preprocessing...');
      const { blob: claheBlob } = await applyCLAHE(imageBlob);

      setProcessingStep('Checking backend...');
      const isOnline = navigator.onLine && await checkBackendHealth();

      let result;
      if (isOnline) {
        setProcessingStep('Running ensemble inference...');
        result = await predictImage(claheBlob || imageBlob, qualityData?.qualityWeight || 1.0);
      } else {
        setProcessingStep('Offline — running MobileNetV3 locally...');
        showInfo('Offline mode: using local model');
        result = await runOfflineInference(claheBlob || imageBlob);
        result.is_offline = true;
      }

      setProcessingStep('Computing triage...');
      const triage = computeTriage(result.severity_grade, result.confidence, result.uncertainty);
      result.triage = triage.level;
      result.triage_action = triage.action;
      result.triage_timeframe = triage.timeframe;

      // Thumbnail
      const tc = document.createElement('canvas');
      tc.width = 120; tc.height = 120;
      tc.getContext('2d').drawImage(await createImageBitmap(imageBlob), 0, 0, 120, 120);
      const thumbnailBase64 = tc.toDataURL('image/jpeg', 0.6).split(',')[1];

      setProcessingStep('Saving results...');
      const scanRecord = {
        patient_id: selectedPatient?.id || null,
        operator_id: operator.id,
        diagnosis: result.diagnosis,
        class_index: result.class_index,
        severity_grade: result.severity_grade,
        confidence: result.confidence,
        uncertainty: result.uncertainty,
        quality_score: qualityData?.qualityWeight || null,
        heatmap_base64: result.heatmap_base64 || null,
        image_thumbnail: thumbnailBase64,
        triage: result.triage,
        is_offline: !!result.is_offline,
        model_used: result.model_used,
        probabilities: result.probabilities,
        notes: '',
      };

      try {
        const saved = await createScan(scanRecord);
        result.scan_id = saved.id;
      } catch {
        await addToQueue(scanRecord);
        showInfo('Saved to offline queue');
      }

      setScanResult({ ...result, patient: selectedPatient, quality: qualityData, exif: exifData, thumbnail: thumbnailBase64 });
      showSuccess(`Diagnosis: ${result.diagnosis} (${(result.confidence * 100).toFixed(1)}%)`);
      navigate('/results');

    } catch (err) {
      showError('Analysis failed: ' + err.message);
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  }

  const severityColors = ['var(--green)', 'var(--cyan)', 'var(--yellow)', 'var(--magenta)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">New Scan</h1>
        <p className="page-subtitle">Search patient by phone or name, then capture a retinal image</p>
      </div>

      {/* ── Patient Lookup ──────────────────────────────── */}
      <div className="glass-card mb-24">
        <div className="flex items-center gap-8 mb-16">
          <Phone size={16} className="text-cyan" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Patient Lookup
          </span>
        </div>

        {!selectedPatient ? (
          <>
            <div className="search-box" style={{ maxWidth: '100%' }}>
              <Search size={16} />
              <input
                className="input-field"
                placeholder="Search by phone number or name..."
                value={phoneSearch}
                onChange={(e) => handlePhoneSearch(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: 8, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)', overflow: 'hidden'
              }}>
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 14,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--cyan-dim)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} className="text-cyan" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-xs text-dim">
                        {p.contact || 'No phone'} · Age {p.age || '?'} · {p.gender || '?'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-dim" />
                  </button>
                ))}
              </div>
            )}

            {searching && <p className="text-xs text-dim mt-8">Searching...</p>}
            {phoneSearch.length >= 3 && searchResults.length === 0 && !searching && (
              <p className="text-xs text-dim mt-8">No patients found. You can register them in the Patients tab.</p>
            )}
          </>
        ) : (
          /* Selected patient card */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 16,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--cyan), var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={24} color="#000" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedPatient.name}</div>
              <div className="text-sm text-dim">
                {selectedPatient.contact || 'No phone'} · Age {selectedPatient.age || '?'} · {selectedPatient.gender || '?'}
              </div>
              {selectedPatient.medical_history && (
                <div className="text-xs text-dim mt-8" style={{ fontStyle: 'italic' }}>
                  {selectedPatient.medical_history}
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={clearPatient}>Change</button>
          </div>
        )}

        {/* Previous scan history for selected patient */}
        {selectedPatient && patientHistory.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="flex items-center gap-8 mb-8">
              <History size={14} className="text-dim" />
              <span className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Previous Scans ({patientHistory.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {patientHistory.map(s => (
                <div key={s.id} style={{
                  padding: '8px 14px', borderRadius: 10, background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)', minWidth: 160, flexShrink: 0
                }}>
                  <div className="text-xs text-dim">{new Date(s.created_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: severityColors[s.severity_grade] || 'var(--text-primary)', marginTop: 2 }}>
                    {s.diagnosis}
                  </div>
                  <div className="text-xs font-mono" style={{ color: severityColors[s.severity_grade], marginTop: 2 }}>
                    Grade {s.severity_grade} · {s.triage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Image Capture ───────────────────────────────── */}
      <div className="glass-card mb-24">
        {!imagePreview && !cameraActive && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={startCamera}>
                <Camera size={22} /> Open Camera
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => fileInputRef.current?.click()}>
                <Upload size={22} /> Upload Image
              </button>
            </div>
            <input
              ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleFileUpload} style={{ display: 'none' }}
            />
            <p className="text-sm text-dim mt-16">Capture or upload a retinal fundus image</p>
          </div>
        )}

        {cameraActive && (
          <div>
            <div className="camera-container">
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
              <div className="camera-overlay" />
            </div>
            <div className="camera-controls">
              <button className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
              <button className="capture-btn" onClick={captureFromCamera} title="Capture" />
            </div>
          </div>
        )}

        {imagePreview && !processing && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src={imagePreview} alt="Retinal scan"
                style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, border: '1px solid var(--border-subtle)' }}
              />
            </div>

            {qualityData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <QualityItem label="Sharpness" value={qualityData.sharpness.toFixed(1)} />
                <QualityItem label="Luminance" value={qualityData.luminance.toFixed(1)} />
                <QualityItem label="Quality" value={qualityData.qualityWeight.toFixed(3)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setImageBlob(null); setImagePreview(null); setExifData(null); setQualityData(null); }}>
                <RefreshCw size={18} /> Retake
              </button>
              <button className="btn btn-primary btn-lg" onClick={runAnalysis}>
                <Zap size={22} /> Analyze Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing overlay */}
      {processing && (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="scan-ring" style={{ marginBottom: 24 }}>
            <div className="scan-ring-circle" />
            <div className="scan-ring-circle" />
            <div className="scan-ring-circle" />
            <div className="scan-ring-center">
              <div className="scan-ring-text">Analyzing</div>
            </div>
          </div>
          <p className="text-cyan font-mono" style={{ fontSize: 13 }}>{processingStep}</p>
        </div>
      )}
    </div>
  );
}

function QualityItem({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
      <div className="text-xs text-dim" style={{ marginBottom: 4 }}>{label}</div>
      <div className="font-mono text-cyan" style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
