/**
 * API client for GemmaFlash backend with multi-image support
 */
export async function generateCardsAPI(imagesOrB64, mimeType = 'image/jpeg') {
  let bodyPayload;

  if (Array.isArray(imagesOrB64)) {
    bodyPayload = { images: imagesOrB64 };
  } else if (typeof imagesOrB64 === 'object' && imagesOrB64.images) {
    bodyPayload = imagesOrB64;
  } else {
    bodyPayload = { imageBase64: imagesOrB64, mimeType };
  }

  let response;
  try {
    response = await fetch('/api/generate-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });
  } catch (err) {
    const error = new Error("Can't reach server. Check connection or try the example.");
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.error) {
    const errObj = data?.error || {};
    const error = new Error(errObj.message || 'The AI service is unavailable. Try again or use the example.');
    error.code = errObj.code || 'UNKNOWN_ERROR';
    throw error;
  }

  return data; // { cards, model, imageCount }
}
