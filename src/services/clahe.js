/**
 * CLAHE Preprocessing — runs entirely in browser.
 * Uses Canvas API for green channel extraction, gaussian blur, and CLAHE-like contrast enhancement.
 * This avoids loading OpenCV.js (~8MB) by implementing a lightweight CLAHE approximation.
 */

/**
 * Apply CLAHE-like preprocessing to a retinal image.
 * @param {HTMLCanvasElement|HTMLImageElement|Blob} input - Image source
 * @returns {Promise<{canvas: HTMLCanvasElement, blob: Blob}>} Preprocessed image
 */
export async function applyCLAHE(input) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Load image onto canvas
  let img;
  if (input instanceof Blob) {
    img = await createImageBitmap(input);
  } else if (input instanceof HTMLImageElement) {
    img = input;
  } else if (input instanceof HTMLCanvasElement) {
    // Already a canvas — read pixels directly
    canvas.width = input.width;
    canvas.height = input.height;
    ctx.drawImage(input, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyEnhancement(imageData);
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvasToBlob(canvas);
    return { canvas, blob };
  } else {
    throw new Error('Unsupported input type');
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyEnhancement(imageData);
  ctx.putImageData(imageData, 0, 0);

  const blob = await canvasToBlob(canvas);
  return { canvas, blob };
}

/**
 * CLAHE-like adaptive histogram equalization on image data.
 * Operates on the luminance channel.
 */
function applyEnhancement(imageData) {
  const { data, width, height } = imageData;
  const tileSize = 64;
  const clipLimit = 3.0;

  // Convert to grayscale luminance for processing
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    luminance[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Process tiles
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(x0 + tileSize, width);
      const y1 = Math.min(y0 + tileSize, height);

      // Build histogram for tile
      const hist = new Int32Array(256);
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          hist[Math.floor(luminance[y * width + x])]++;
          count++;
        }
      }

      // Clip histogram
      const limit = Math.floor(clipLimit * count / 256);
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > limit) {
          excess += hist[i] - limit;
          hist[i] = limit;
        }
      }
      const perBin = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        hist[i] += perBin;
      }

      // Build CDF
      const cdf = new Float32Array(256);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
      }
      const cdfMin = cdf.find(v => v > 0) || 0;
      const scale = 255 / (count - cdfMin || 1);

      // Apply equalization
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = y * width + x;
          const px = Math.floor(luminance[idx]);
          const newVal = Math.round((cdf[px] - cdfMin) * scale);
          const factor = (newVal + 1) / (px + 1);

          const pi = idx * 4;
          data[pi] = Math.min(255, Math.round(data[pi] * factor));
          data[pi + 1] = Math.min(255, Math.round(data[pi + 1] * factor));
          data[pi + 2] = Math.min(255, Math.round(data[pi + 2] * factor));
        }
      }
    }
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * Extract the green channel (most informative for retinal images).
 */
export function extractGreenChannel(imageData) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  for (let i = 0; i < data.length; i += 4) {
    const g = data[i + 1];
    result.data[i] = g;
    result.data[i + 1] = g;
    result.data[i + 2] = g;
    result.data[i + 3] = 255;
  }
  return result;
}
