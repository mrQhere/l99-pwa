import { HF_SPACES_URL, DEMO_MODE, CLASS_NAMES } from '../utils/constants';

/**
 * Send image to HuggingFace Spaces for full ensemble inference.
 * Returns diagnosis, severity, confidence, uncertainty, and Grad-CAM heatmap.
 */
export async function predictImage(imageBlob, qualityWeight = 1.0) {
  if (DEMO_MODE) {
    return generateDemoResult();
  }

  const formData = new FormData();
  formData.append('file', imageBlob, 'scan.png');
  formData.append('quality_weight', qualityWeight.toString());

  const response = await fetch(`${HF_SPACES_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check if the HuggingFace Spaces backend is reachable.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${HF_SPACES_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Demo mode: generate realistic-looking fake results for testing.
 */
function generateDemoResult() {
  const classIdx = Math.floor(Math.random() * 5);
  const probs = Array.from({ length: 5 }, () => Math.random());
  probs[classIdx] += 2;
  const total = probs.reduce((a, b) => a + b, 0);
  const normalized = probs.map(p => p / total);

  return {
    success: true,
    demo_mode: true,
    diagnosis: CLASS_NAMES[classIdx],
    class_index: classIdx,
    confidence: Math.max(...normalized),
    probabilities: normalized,
    severity_grade: classIdx,
    severity_score: classIdx / 4,
    uncertainty: Math.random() * 0.15 + 0.02,
    heatmap_base64: null,
    model_used: 'demo_simulation',
    mc_passes: 10,
    quality_weight: 1.0,
  };
}
