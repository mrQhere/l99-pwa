// ── L99 Constants ─────────────────────────────────────────
// Update these with your actual values after setup

// Set to true for demo mode (simulated predictions without trained models)
export const DEMO_MODE = true;

// HuggingFace Spaces backend URL
// After deploying, replace with: https://mrQhere-l99-backend.hf.space
export const HF_SPACES_URL = 'https://mrQhere-l99-backend.hf.space';

// Supabase credentials
// Get these from: supabase.com → Your Project → Settings → API
export const SUPABASE_URL = 'https://okazouqbtshyyegrczwz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_1avoLqtLYX71Q5bfMNlHIA_l4jNCMzH';

// Operator credentials (hardcoded login)
export const OPERATORS = {
  '001': { password: 'admin', name: 'Operator Alpha', role: 'Senior Screener' },
  '100': { password: 'admin', name: 'Operator Bravo', role: 'Field Worker' },
  '007': { password: 'admin', name: 'Operator Charlie', role: 'Clinical Lead' },
  '009': { password: 'admin', name: 'Operator Delta', role: 'Research Analyst' },
};

// Disease classes
export const CLASS_NAMES = [
  'No DR',
  'Mild DR',
  'Moderate DR',
  'Severe DR',
  'Proliferative DR',
];

// Severity labels
export const SEVERITY_LABELS = {
  0: 'Grade 0 — No Apparent DR',
  1: 'Grade 1 — Mild NPDR',
  2: 'Grade 2 — Moderate NPDR',
  3: 'Grade 3 — Severe NPDR',
  4: 'Grade 4 — Proliferative DR',
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
export const APP_NAME = 'L99';
