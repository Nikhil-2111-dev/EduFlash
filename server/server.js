import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 8787;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '50mb' }));

const MODELS = [
  process.env.PRIMARY_MODEL || 'gemma-4-26b-a4b-it',
  process.env.FALLBACK_MODEL || 'gemma-4-31b-it',
  'gemini-2.5-flash',
];
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const SYSTEM_PROMPT = `You are an expert tutor who builds active-recall flashcards from images of study material
(handwritten notes, whiteboards, diagrams, flowcharts, textbook pages).

Rules:
1. Read all provided images carefully, including handwriting, arrows, boxes, hierarchy, labels, and order.
2. Create 6 to 12 cards. Each card tests ONE specific idea.
3. When multiple images are provided (Image 1, Image 2, etc.):
   - MANDATORY COVERAGE: You MUST generate at least ONE card testing content from EACH individual image.
   - CROSS-IMAGE SYNTHESIS: You MUST generate at least TWO cards testing the connection, sequence, dependency, or relationship BETWEEN the different images (e.g. how Image 1 leads to Image 2).
   - "tag" should specify the context or source image (e.g. "Image 1: Setup", "Image 2: State", "Cross-Diagram Flow").
4. If only one image is provided:
   - At least 2 cards must test relationships or direction visible in the image.
5. Questions must be answerable from the image contents; do not invent contradictory facts.
6. "back" must be self-contained and concise (max 280 characters). "front" max 140 characters.
7. "tag" is 1–2 words in Title Case naming the topic. "difficulty" is exactly "easy", "medium" or "hard".
8. If the images are unreadable or contain no study content, return [].
9. Output ONLY a raw JSON array. No markdown, no code fences, no commentary.

Schema: [{"front":"string","back":"string","tag":"string","difficulty":"easy|medium|hard"}]`;

const SCHEMA = {
  type: 'array',
  minItems: 3,
  maxItems: 12,
  items: {
    type: 'object',
    properties: {
      front: { type: 'string' },
      back: { type: 'string' },
      tag: { type: 'string' },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    },
    required: ['front', 'back', 'tag', 'difficulty'],
  },
};

const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

const withTimeout = (p, ms) =>
  Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);

export function parseCards(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let arr;
  try {
    arr = JSON.parse(t);
  } catch {
    const a = t.indexOf('[');
    const b = t.lastIndexOf(']');
    if (a === -1 || b <= a) throw new Error('BAD_MODEL_OUTPUT');
    arr = JSON.parse(t.slice(a, b + 1));
  }
  if (!Array.isArray(arr)) throw new Error('BAD_MODEL_OUTPUT');

  const seen = new Set();
  const cards = [];
  for (const c of arr) {
    if (!c || typeof c.front !== 'string' || typeof c.back !== 'string') continue;
    const front = c.front.trim().slice(0, 140);
    const back = c.back.trim().slice(0, 280);
    if (!front || !back || seen.has(front.toLowerCase())) continue;
    seen.add(front.toLowerCase());
    cards.push({
      front,
      back,
      tag: (typeof c.tag === 'string' && c.tag.trim()) || 'General',
      difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
    });
  }
  if (cards.length < 3) throw new Error('BAD_MODEL_OUTPUT');
  return cards.slice(0, 12);
}

const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 35000;

async function callModel(ai, model, images, useSchema) {
  const isGemini = model.includes('gemini');
  const config = {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.4,
    responseMimeType: 'application/json',
    ...(useSchema && isGemini ? { responseSchema: SCHEMA } : {}),
  };

  const parts = images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.imageBase64 },
  }));

  if (images.length === 1) {
    parts.push({ text: 'Generate flashcards from this image.' });
  } else {
    parts.push({
      text: `Analyze all ${images.length} images provided in sequential order (Image 1 through Image ${images.length}).
Generate 6 to 12 active-recall flashcards.
MANDATORY RULES:
1. Generate at least ONE card testing specific content from EACH individual image.
2. Generate at least TWO cards testing the relationship, sequence flow, dependencies, or transitions BETWEEN the different images.
3. Keep front questions <= 140 chars and back answers <= 280 chars. Return ONLY a raw JSON array.`,
    });
  }

  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config,
    }),
    TIMEOUT_MS
  );

  return parseCards(response.text);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/generate-cards', async (req, res) => {
  let images = req.body?.images;
  if (!images && req.body?.imageBase64) {
    images = [{ imageBase64: req.body.imageBase64, mimeType: req.body.mimeType || 'image/jpeg' }];
  }

  if (!Array.isArray(images) || images.length === 0) {
    return fail(res, 400, 'BAD_REQUEST', 'No images received.');
  }

  if (images.length > 4) {
    return fail(res, 400, 'BAD_REQUEST', 'Maximum 4 images allowed per study deck.');
  }

  for (const img of images) {
    if (!img?.imageBase64 || typeof img.imageBase64 !== 'string') {
      return fail(res, 400, 'BAD_REQUEST', 'One or more images are missing imageBase64 data.');
    }
    if (!ALLOWED.includes(img.mimeType)) {
      return fail(res, 415, 'UNSUPPORTED_TYPE', 'Only PNG and JPEG images are supported.');
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fail(res, 502, 'MODEL_FAILED', 'GEMINI_API_KEY is not configured in server/.env.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let lastErr;
  for (const model of MODELS) {
    const isGemini = model.includes('gemini');
    const schemaAttempts = isGemini ? [true, false] : [false];
    for (const useSchema of schemaAttempts) {
      try {
        const cards = await callModel(ai, model, images, useSchema);
        return res.json({ cards, model, imageCount: images.length });
      } catch (e) {
        lastErr = e;
        console.error(`[${model}] schema=${useSchema}:`, e.message);
        if (e.message === 'TIMEOUT' || e.message === 'BAD_MODEL_OUTPUT') {
          break; // move to next model
        }
      }
    }
  }

  if (lastErr?.message === 'TIMEOUT') {
    return fail(res, 504, 'TIMEOUT', 'The model took too long. Try again or use the example.');
  }
  if (lastErr?.message === 'BAD_MODEL_OUTPUT') {
    return fail(res, 502, 'BAD_MODEL_OUTPUT', "Couldn't read usable flashcards from the images. Try clearer photos.");
  }
  return fail(res, 502, 'MODEL_FAILED', 'The AI service is unavailable. Try again or use the example.');
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`GemmaFlash server listening on port ${PORT}`);
  });
}

export default app;
