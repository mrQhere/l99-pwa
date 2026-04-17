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
    ort.env.wasm.wasmPaths = '/';

    session = await ort.InferenceSession.create('/mobilenetv3_eyescan.onnx', {
      executionProviders: ['wasm'],
    });

    console.log('ONNX model loaded successfully');
    return true;
  } catch (err) {
    console.warn('ONNX model failed to load:', err.message);
    throw new Error(err.message);
  }
}

/**
 * Run offline inference using MobileNetV3 ONNX model.
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

  // Create float32 tensor [1, 224, 224, 3] normalized to [0, 1]
  const float32Data = new Float32Array(1 * 224 * 224 * 3);
  for (let i = 0; i < 224 * 224; i++) {
    float32Data[i * 3] = data[i * 4] / 255.0;
    float32Data[i * 3 + 1] = data[i * 4 + 1] / 255.0;
    float32Data[i * 3 + 2] = data[i * 4 + 2] / 255.0;
  }

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 224, 224, 3]);

  // Run inference
  const feeds = {};
  const inputName = session.inputNames[0];
  feeds[inputName] = inputTensor;

  const results = await session.run(feeds);

  // Parse outputs
  let probabilities;
  let severityScore = 0;

  // Try to get classification output
  const clsOutput = results['classification'] || results[session.outputNames[0]];
  if (clsOutput) {
    probabilities = Array.from(clsOutput.data);
  } else {
    probabilities = [0.2, 0.2, 0.2, 0.2, 0.2];
  }

  // Try to get severity output
  const sevOutput = results['severity'] || results[session.outputNames[1]];
  if (sevOutput) {
    severityScore = sevOutput.data[0];
  }

  const classIdx = probabilities.indexOf(Math.max(...probabilities));

  return {
    success: true,
    demo_mode: false,
    diagnosis: CLASS_NAMES[classIdx],
    class_index: classIdx,
    confidence: Math.max(...probabilities),
    probabilities,
    severity_grade: Math.min(4, Math.max(0, Math.round(severityScore * 4))),
    severity_score: severityScore,
    uncertainty: -1, // Unknown for single-pass offline inference
    heatmap_base64: null, // No Grad-CAM offline
    model_used: 'mobilenetv3_offline_onnx',
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
