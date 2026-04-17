/**
 * Image Quality Scoring — runs entirely in browser via Canvas API.
 * Computes Laplacian variance (sharpness) and luminance score.
 * Returns a quality weight between 0.0 and 1.0.
 */

/**
 * Compute quality score for a retinal image.
 * @param {HTMLCanvasElement|Blob} input - Image to score
 * @returns {Promise<{sharpness: number, luminance: number, qualityWeight: number}>}
 */
export async function computeQualityScore(input) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let img;
  if (input instanceof Blob) {
    img = await createImageBitmap(input);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  } else if (input instanceof HTMLCanvasElement) {
    canvas.width = input.width;
    canvas.height = input.height;
    ctx.drawImage(input, 0, 0);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // 1. Laplacian variance (sharpness)
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  let lapSum = 0, lapSumSq = 0, lapCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap = -4 * gray[idx]
        + gray[idx - 1] + gray[idx + 1]
        + gray[idx - width] + gray[idx + width];
      lapSum += lap;
      lapSumSq += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapSum / lapCount;
  const laplacianVariance = (lapSumSq / lapCount) - (lapMean * lapMean);

  // 2. Luminance score (mean brightness, penalize too dark or too bright)
  let totalLum = 0;
  for (let i = 0; i < gray.length; i++) {
    totalLum += gray[i];
  }
  const meanLuminance = totalLum / gray.length;
  // Ideal luminance is around 80-140 for retinal images
  const lumScore = 1.0 - Math.abs(meanLuminance - 110) / 110;

  // 3. Compute quality weight
  // Normalize Laplacian variance: >500 is sharp, <100 is blurry
  const sharpnessNorm = Math.min(1.0, laplacianVariance / 500);
  const lumNorm = Math.max(0, Math.min(1, lumScore));

  const qualityWeight = 0.6 * sharpnessNorm + 0.4 * lumNorm;

  return {
    sharpness: Math.round(laplacianVariance * 100) / 100,
    luminance: Math.round(meanLuminance * 100) / 100,
    qualityWeight: Math.round(Math.max(0.1, Math.min(1.0, qualityWeight)) * 1000) / 1000,
  };
}
