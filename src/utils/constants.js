// ── L99 Constants ─────────────────────────────────────────
// Update these with your actual values after setup

// Set to true for demo mode (simulated predictions without trained models)
export const DEMO_MODE = false;

// HuggingFace Spaces backend URL
export const HF_SPACES_URL = import.meta.env.VITE_HF_SPACES_URL || 'https://example-backend.hf.space';

// Supabase credentials
// Get these from: supabase.com → Your Project → Settings → API
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Operator credentials (hardcoded login)
export const OPERATORS = {
  '001': { 
    password: 'admin', 
    name: 'Clinician Unit 01', 
    role: 'Screener',
    doctorName: 'Dr. Vision Support',
    isMaster: false 
  },
  '007': { 
    password: 'admin1', 
    name: 'L99 Master Executive', 
    role: 'Clinical Lead / Admin',
    doctorName: 'Global AI Center',
    isMaster: true 
  },
};

// Disease classes
export const CLASS_NAMES = [
  'No DR',
  'Mild DR',
  'Moderate DR',
  'Severe DR',
  'Proliferative DR',
  'Cataract',
  'Glaucoma Suspect',
  'Macular Degeneration',
  'Hypertensive Retinopathy',
];

// Severity labels
export const SEVERITY_LABELS = {
  0: 'Grade 0 — Healthy / No Apparent DR',
  1: 'Grade 1 — Mild NPDR',
  2: 'Grade 2 — Moderate NPDR',
  3: 'Grade 3 — Severe NPDR',
  4: 'Grade 4 — Proliferative DR',
  5: 'Cataract Findings',
  6: 'Glaucoma Risk Detected',
  7: 'Macular Changes (AMD)',
  8: 'Vascular Changes (High BP)',
};

// Triage levels
export const TRIAGE_LEVELS = {
  ROUTINE: 'Routine',
  PRIORITY: 'Priority',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
};

// App version
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Eye Scan';
