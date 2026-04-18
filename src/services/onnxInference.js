import { CLASS_NAMES } from '../utils/constants';

/**
 * ONNX Runtime Web offline inference — MobileNetV3 only.
 * Used when HuggingFace Spaces is unreachable.
 */

let session = null;

/**
 * Load the ONNX model (MobileNetV3).
 * @returns {Promise<boolean>} true if model loaded successfully
 */
export async function loadONNXModel() {
  try {
    if (session) return true;

    const ort = await import('onnxruntime-web');
    
    // Ensure WASM files are loaded from the root public directory
    const path = window.location.origin + '/';
    ort.env.wasm.wasmPaths = path;
    
    // Enable SIMD and JEP if available in the browser
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

    session = await ort.InferenceSession.create('/mobilenetv3_eyescan.onnx', {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });

    console.log('ONNX model loaded successfully');
    return true;
  } catch (err) {
    console.warn('ONNX model failed to load:', err.message);
    throw new Error(err.message);
  }
}

/**
 * Run offline inference using MobileNetV3 ONNX model (NCHW format).
 * @param {Blob} imageBlob - Preprocessed image
 * @returns {Promise<Object>} Prediction result
 */
export async function runOfflineInference(imageBlob) {
  if (!session) {
    try {
      await loadONNXModel();
    } catch (err) {
      throw new Error(`ONNX Load Error: ${err.message}`);
    }
  }

  const ort = await import('onnxruntime-web');

  // Preprocess image to 224x224 tensor
  const imageBitmap = await createImageBitmap(imageBlob);
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, 224, 224);

  const imageData = ctx.getImageData(0, 0, 224, 224);
  const { data } = imageData;

  /**
   * Create float32 tensor [1, 3, 224, 224] (NCHW)
   * Standard ImageNet Normalization: (x - mean) / std
   */
  const float32Data = new Float32Array(1 * 3 * 224 * 224);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < 224 * 224; i++) {
    // Red channel
    float32Data[i] = ((data[i * 4] / 255.0) - mean[0]) / std[0];
    // Green channel
    float32Data[i + 224 * 224] = ((data[i * 4 + 1] / 255.0) - mean[1]) / std[1];
    // Blue channel
    float32Data[i + 2 * 224 * 224] = ((data[i * 4 + 2] / 255.0) - mean[2]) / std[2];
  }

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);

  // Run inference
  const feeds = {};
  const inputName = session.inputNames[0];
  feeds[inputName] = inputTensor;

  const results = await session.run(feeds);

  // Parse outputs
  let probabilities;
  let severityScore = 0;

  // Try to get classification output (usually the first output)
  const clsOutput = results['classification'] || results[session.outputNames[0]];
  if (clsOutput) {
    probabilities = Array.from(clsOutput.data);
  } else {
    // Fallback for 6 classes if output is missing
    probabilities = new Array(CLASS_NAMES.length).fill(1 / CLASS_NAMES.length);
  }

  // Try to get severity output (usually the second output)
  const sevOutput = results['severity'] || results[session.outputNames[1]];
  if (sevOutput) {
    severityScore = sevOutput.data[0];
  }

  const classIdx = probabilities.indexOf(Math.max(...probabilities));

  // For DR grades (0-4): map severity output. For other diseases (5-8): use classIdx directly.
  let severityGrade;
  if (classIdx <= 4) {
    severityGrade = Math.min(4, Math.max(0, Math.round(severityScore * 4)));
  } else {
    severityGrade = classIdx; // Cataract=5, Glaucoma=6, AMD=7, Hypertensive=8
  }

  return {
    success: true,
    demo_mode: false,
    diagnosis: CLASS_NAMES[classIdx] || 'Unknown',
    class_index: classIdx,
    confidence: Math.max(...probabilities),
    probabilities,
    severity_grade: severityGrade,
    severity_score: severityScore,
    uncertainty: -1, 
    heatmap_base64: null, 
    model_used: 'mobilenetv3_offline_onnx_nchw',
    mc_passes: 0,
    quality_weight: 1.0,
  };
}

/**
 * Check if ONNX model is available.
 */
export function isModelLoaded() {
  return session !== null;
}
