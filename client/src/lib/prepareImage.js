/**
 * Prepares an image for Gemma 4 processing:
 * 1. Reads image bitmap
 * 2. Downscales maintaining aspect ratio if max dimension > maxEdge (1568px)
 * 3. Flattens transparent PNG backgrounds to white
 * 4. Encodes as JPEG at specified quality (~0.85)
 * 5. Returns preview data URL and clean base64 string (no data: prefix)
 */
async function loadImageSource(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      return {
        drawable: bmp,
        width: bmp.width,
        height: bmp.height,
        close: () => bmp.close?.(),
      };
    } catch (e) {
      console.warn('createImageBitmap failed, using Image element fallback:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({
        drawable: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        close: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to decode image file'));
    };
    img.src = url;
  });
}

/**
 * Prepares an image for Gemma 4 processing:
 * 1. Reads image bitmap or element
 * 2. Downscales maintaining aspect ratio if max dimension > maxEdge (1568px)
 * 3. Flattens transparent PNG backgrounds to white
 * 4. Encodes as JPEG at specified quality (~0.85)
 * 5. Returns preview data URL and clean base64 string (no data: prefix)
 */
export async function prepareImage(file, maxEdge = 1568, quality = 0.85) {
  const source = await loadImageSource(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext('2d');

    // Flatten transparent PNGs with pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source.drawable, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const imageBase64 = dataUrl.split(',')[1];

    return {
      previewUrl: dataUrl,
      imageBase64,
      mimeType: 'image/jpeg',
    };
  } finally {
    source.close();
  }
}
