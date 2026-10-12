# GemmaFlash — Product Requirements Document (v2)

> **Audience:** a human builder AND a coding LLM. Sections 5–9 are the source of truth ("contracts"). If anything elsewhere conflicts with them, the contracts win.
> **Companion doc:** `GemmaFlash_Design_v2.md` (all visual/UI rules). This PRD never specifies styling.

---

## 0. Instructions for a coding LLM
1. Build in the order given in **§10 Build Plan**. Do not skip checkpoints.
2. Implement only what is in **§3 (Must / Should)**. Anything under "Won't" is out of scope. Do not add auth, databases, routing, or extra pages.
3. Use the exact file tree (§5.2), API contract (§6), data contract (§7) and system prompt (§8).
4. Never put the API key in client code. It lives only in `server/.env`.
5. After each checkpoint, state what you verified before continuing.

---

## 1. Overview

| Item | Value |
|---|---|
| Product | GemmaFlash — turns a photo of handwritten notes / a diagram / a flowchart into active-recall flashcards |
| Event | Hacktoberfest Hack Day Hyderabad (MLH x NIAT – KKH) |
| Challenge | **Best Use of Gemma 4** (multimodal input → understanding → app response → user action) |
| Build window | 120 minutes |
| Architecture | Stateless web app; no database |

**Problem.** Study material is often non-linear and visual (whiteboard diagrams, margin notes, flowcharts). Plain OCR flattens it into text and loses arrows, hierarchy and spatial relationships. Learners end up with "trapped information" they can't self-test on.

**Solution.** Send the image directly to Gemma 4's vision capability. It reads handwriting *and* the structure (what points to what), then returns structured flashcards the UI renders as flip cards.

**Single user story (the only one that must work).**
> As a student, I drop a photo of my diagram, get 6–10 flashcards in under ~20 seconds, and flip through them to test myself.

**Success criteria**
- S1: Full flow (upload → cards → flip) works **twice in a row** without reload or crash.
- S2: Upload-to-cards ≤ 20 s on typical venue Wi-Fi (p50), hard timeout 30 s.
- S3: At least one card in the demo tests a *relationship/direction* (e.g. "what happens after X?"), proving diagram understanding beyond OCR.
- S4: "Load Example" works with the network disabled.

---

## 2. Constraints & Non-goals

**Constraints**
- 120 min total. Prefer boring, proven tools.
- Gemma 4 accessed only via the Gemini API with `@google/genai`.
- Inputs: PNG / JPEG only.
- Must run locally with two commands (`npm run dev` in `server/` and `client/`).

**Non-goals (v1):** user accounts, database, PDFs, multi-image, deck editing, spaced repetition, export, i18n, deployment polish.

---

## 3. Scope

| ID | Priority | Feature | Acceptance criteria |
|---|---|---|---|
| F1 | Must | Drag-and-drop / click-to-pick image | Accepts only `image/png`, `image/jpeg`; rejects others with inline error; shows thumbnail preview; max 10 MB raw |
| F2 | Must | Client-side image prep | Image downscaled so longest edge ≤ 1568 px, re-encoded JPEG q≈0.85, sent as base64 (no `data:` prefix) |
| F3 | Must | `POST /api/generate-cards` | Matches §6; returns validated cards or a typed error |
| F4 | Must | Gemma 4 call with JSON contract | Uses §8 prompt/config; output parsed and validated per §7 |
| F5 | Must | Flashcard grid with flip | Click / Enter / Space flips a card; shows `front`, `back`, `tag`, `difficulty` |
| F6 | Must | Demo mode ("Load Example") | Renders bundled `demoDeck.json` instantly, zero network calls |
| F7 | Must | Loading + error states | Indeterminate loading bar while waiting; human-readable error banner with Retry; never a blank screen |
| F8 | Should | Persist last deck | `localStorage` key `gemmaflash.deck.v1`; restored on load; wrapped in try/catch |
| F9 | Should | Model fallback | If primary model errors/times out, retry once on fallback model (§8.3) |
| F10 | Could | "Shuffle" and "Reset flips" buttons | Client-only |
| F11 | Could | Filter by tag | Client-only |
| — | Won't | Everything in §2 Non-goals | — |

---

## 4. Core Loop

| # | Phase | User action | System behavior |
|---|---|---|---|
| 1 | Share | Drops image | Validate type/size → downscale → base64 → preview |
| 2 | Understand | Clicks **Generate Cards** | `POST /api/generate-cards` → server calls Gemma 4 with image + prompt |
| 3 | Respond | Waits ≤ 20 s | Server validates JSON → returns `cards[]` → UI renders grid |
| 4 | Act | Flips cards | Self-test; flip state is local to each card |

---

## 5. Architecture

### 5.1 Stack (pin these)
- **Client:** React 18 + Vite 5, Tailwind CSS **3.4** (not v4), plain `useState`.
- **Server:** Node 20+, Express 4, `cors`, `dotenv`, `@google/genai` (latest).
- **Models:** primary `gemma-4-26b-a4b-it` (MoE, faster); fallback `gemma-4-31b-it` (dense, higher quality). Both accept image input and support system instructions and JSON output through the Gemini API.

### 5.2 File tree
```
gemmaflash/
├─ client/
│  ├─ index.html
│  ├─ vite.config.js            # dev proxy: /api -> http://localhost:8787
│  ├─ tailwind.config.js        # tokens from Design doc §2
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx                # state machine (§5.3)
│     ├─ index.css              # Design doc §9
│     ├─ lib/prepareImage.js    # F2
│     ├─ lib/api.js             # fetch wrapper + typed errors
│     ├─ data/demoDeck.json     # F6 (see §7.4)
│     └─ components/
│        ├─ Dropzone.jsx
│        ├─ Flashcard.jsx
│        ├─ CardGrid.jsx
│        ├─ LoadingBar.jsx
│        └─ ErrorBanner.jsx
└─ server/
   ├─ server.js
   ├─ package.json              # "type": "module"
   └─ .env                      # GEMINI_API_KEY=...  (never committed)
```

### 5.3 Client state machine
`status`: `idle` → `ready` (image chosen) → `loading` → `success` | `error`.
Demo mode jumps `idle → success` directly. Any state → `idle` via Reset.
State shape: `{ status, imagePreviewUrl, imageB64, mimeType, cards, error }`.

### 5.4 Environment variables (`server/.env`)
```
GEMINI_API_KEY=your_key
PORT=8787
CLIENT_ORIGIN=http://localhost:5173
PRIMARY_MODEL=gemma-4-26b-a4b-it
FALLBACK_MODEL=gemma-4-31b-it
```

---

## 6. API Contract

### `POST /api/generate-cards`
**Request** (`application/json`, body limit 8 MB)
```json
{ "imageBase64": "<base64, no data: prefix>", "mimeType": "image/jpeg" }
```
**200 response**
```json
{ "cards": [ /* Card[] per §7 */ ], "model": "gemma-4-26b-a4b-it" }
```
**Error response** (always this shape)
```json
{ "error": { "code": "BAD_REQUEST | UNSUPPORTED_TYPE | MODEL_FAILED | BAD_MODEL_OUTPUT | TIMEOUT", "message": "human readable" } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | missing/empty `imageBase64` |
| 415 | `UNSUPPORTED_TYPE` | `mimeType` not png/jpeg |
| 502 | `MODEL_FAILED` | both models errored |
| 502 | `BAD_MODEL_OUTPUT` | output unparsable or fewer than 3 valid cards after cleaning |
| 504 | `TIMEOUT` | no response within 25 s per model attempt |

### `GET /api/health` → `{ "ok": true }` (used for a quick pre-demo check).

---

## 7. Data Contract

### 7.1 Card
```ts
type Card = {
  front: string;       // question or prompt, <= 140 chars
  back: string;        // answer, <= 280 chars, self-contained
  tag: string;         // 1–2 words, Title Case, e.g. "Process Flow"
  difficulty: "easy" | "medium" | "hard";
};
```

### 7.2 Validation & cleaning (server, after parsing)
1. Must be a JSON array; otherwise `BAD_MODEL_OUTPUT`.
2. Drop items missing a non-empty string `front` or `back`.
3. Trim strings; truncate `front` to 140 and `back` to 280 chars.
4. `tag` defaults to `"General"`; `difficulty` defaults to `"medium"` if invalid.
5. Deduplicate by lowercase `front`; cap at 12 cards.
6. If fewer than 3 cards remain → `BAD_MODEL_OUTPUT`.

### 7.3 JSON Schema (also passed as `responseSchema` when supported)
```json
{
  "type": "array",
  "minItems": 3,
  "maxItems": 12,
  "items": {
    "type": "object",
    "properties": {
      "front": { "type": "string" },
      "back": { "type": "string" },
      "tag": { "type": "string" },
      "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] }
    },
    "required": ["front", "back", "tag", "difficulty"]
  }
}
```

### 7.4 Demo deck (`client/src/data/demoDeck.json`)
Ship a pre-baked deck matching a real image you will demo (replace with output from your own best run). Placeholder:
```json
[
  { "front": "What is the first packet sent in a TCP three-way handshake?", "back": "SYN from client to server, carrying the client's initial sequence number.", "tag": "TCP", "difficulty": "easy" },
  { "front": "What does the server send after receiving SYN?", "back": "SYN-ACK: it acknowledges the client's sequence number and sends its own.", "tag": "TCP", "difficulty": "medium" },
  { "front": "In the diagram, which message completes the handshake and who sends it?", "back": "ACK, sent by the client; the connection is then ESTABLISHED on both sides.", "tag": "Process Flow", "difficulty": "medium" },
  { "front": "Why can't data be sent before the third step finishes?", "back": "Both sides must confirm sequence numbers first; otherwise delivery and ordering cannot be guaranteed.", "tag": "Reasoning", "difficulty": "hard" },
  { "front": "What state does the client enter after sending SYN?", "back": "SYN-SENT, waiting for the server's SYN-ACK.", "tag": "States", "difficulty": "medium" },
  { "front": "Which direction does the arrow for SYN-ACK point?", "back": "From server to client, between the first and last arrows in the flow.", "tag": "Diagram Reading", "difficulty": "easy" }
]
```

---

## 8. AI Contract

### 8.1 Request configuration
- Contents: one user turn with two parts: `inlineData { mimeType, data }` then the text prompt in §8.2.
- `config`: `systemInstruction` (below), `temperature: 0.4`, `responseMimeType: "application/json"`, `responseSchema` per §7.3.
- Read the result from `response.text`.
- **If the API rejects `responseSchema` (HTTP 400), remove it and retry** — the prompt + parser (§8.4) still enforce the contract.

### 8.2 Prompts
**System instruction**
```
You are an expert tutor who builds active-recall flashcards from images of study material
(handwritten notes, whiteboards, diagrams, flowcharts, textbook pages).

Rules:
1. Read the image carefully, including handwriting, arrows, boxes, hierarchy and labels.
2. Create 6 to 10 cards. Each card tests ONE idea.
3. At least 2 cards must test relationships or direction visible in the image
   (e.g. "what comes after X", "what does A depend on", "why does B point to C").
4. Questions must be answerable from the image content; do not invent facts that contradict it.
5. "back" must be self-contained and concise (max 280 characters). "front" max 140 characters.
6. "tag" is 1–2 words in Title Case naming the topic. "difficulty" is exactly "easy", "medium" or "hard".
7. If the image is unreadable or contains no study content, return [].
8. Output ONLY a raw JSON array. No markdown, no code fences, no commentary.

Schema: [{"front":"string","back":"string","tag":"string","difficulty":"easy|medium|hard"}]
```
**User text part:** `Generate flashcards from this image.`

### 8.3 Model strategy
1. Attempt 1: `PRIMARY_MODEL`, 25 s timeout.
2. On error, timeout or unparsable output: Attempt 2 on `FALLBACK_MODEL`, 25 s timeout.
3. Both fail → `MODEL_FAILED` / `TIMEOUT` / `BAD_MODEL_OUTPUT` per §6.

### 8.4 Tolerant parser
Strip leading/trailing whitespace and ``` fences, then `JSON.parse`. If that fails, slice from the first `[` to the last `]` and parse again. Then apply §7.2.

---

## 9. Reference Implementation (starter code)

### 9.1 `server/server.js`
```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '8mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = [
  process.env.PRIMARY_MODEL || 'gemma-4-26b-a4b-it',
  process.env.FALLBACK_MODEL || 'gemma-4-31b-it',
];
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg'];

const SYSTEM_PROMPT = `/* paste §8.2 system instruction here */`;
const SCHEMA = { /* paste §7.3 here */ };

const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), ms))]);

function parseCards(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let arr;
  try { arr = JSON.parse(t); }
  catch {
    const a = t.indexOf('['), b = t.lastIndexOf(']');
    if (a === -1 || b <= a) throw new Error('BAD_MODEL_OUTPUT');
    arr = JSON.parse(t.slice(a, b + 1));
  }
  if (!Array.isArray(arr)) throw new Error('BAD_MODEL_OUTPUT');
  const seen = new Set();
  const cards = [];
  for (const c of arr) {
    if (!c || typeof c.front !== 'string' || typeof c.back !== 'string') continue;
    const front = c.front.trim().slice(0, 140), back = c.back.trim().slice(0, 280);
    if (!front || !back || seen.has(front.toLowerCase())) continue;
    seen.add(front.toLowerCase());
    cards.push({
      front, back,
      tag: (typeof c.tag === 'string' && c.tag.trim()) || 'General',
      difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
    });
  }
  if (cards.length < 3) throw new Error('BAD_MODEL_OUTPUT');
  return cards.slice(0, 12);
}

async function callModel(model, imageBase64, mimeType, useSchema) {
  const config = {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.4,
    responseMimeType: 'application/json',
    ...(useSchema ? { responseSchema: SCHEMA } : {}),
  };
  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: 'Generate flashcards from this image.' },
      ]}],
      config,
    }),
    25000
  );
  return parseCards(response.text);
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/generate-cards', async (req, res) => {
  const { imageBase64, mimeType } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string')
    return fail(res, 400, 'BAD_REQUEST', 'No image received.');
  if (!ALLOWED.includes(mimeType))
    return fail(res, 415, 'UNSUPPORTED_TYPE', 'Only PNG and JPEG images are supported.');

  let lastErr;
  for (const model of MODELS) {
    for (const useSchema of [true, false]) {          // retry without schema if API rejects it
      try {
        const cards = await callModel(model, imageBase64, mimeType, useSchema);
        return res.json({ cards, model });
      } catch (e) {
        lastErr = e;
        console.error(`[${model}] schema=${useSchema}:`, e.message);
        if (e.message === 'TIMEOUT' || e.message === 'BAD_MODEL_OUTPUT') break; // go to next model
      }
    }
  }
  if (lastErr?.message === 'TIMEOUT') return fail(res, 504, 'TIMEOUT', 'The model took too long. Try again or use the example.');
  if (lastErr?.message === 'BAD_MODEL_OUTPUT') return fail(res, 502, 'BAD_MODEL_OUTPUT', "Couldn't read usable flashcards from that image. Try a clearer photo.");
  return fail(res, 502, 'MODEL_FAILED', 'The AI service is unavailable. Try again or use the example.');
});

app.listen(process.env.PORT || 8787, () => console.log('GemmaFlash server up'));
```

### 9.2 `client/src/lib/prepareImage.js`
```js
export async function prepareImage(file, maxEdge = 1568, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';                       // flatten transparent PNGs
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { previewUrl: dataUrl, imageBase64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
}
```

### 9.3 `client/vite.config.js` (proxy avoids CORS in dev)
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
});
```
Client code calls `fetch('/api/generate-cards', ...)` with a relative URL.

---

## 10. Build Plan (120 min)

| Min | Task | Checkpoint (must pass before moving on) |
|---|---|---|
| 0–10 | Scaffold client + server, install deps, `.env`, health route | `GET /api/health` returns `{ok:true}` via the Vite proxy |
| 10–25 | **Server AI call** (§9.1) tested with `curl` or a script using a real diagram photo | Returns ≥ 6 valid cards for your demo image |
| 25–40 | Client state machine, `prepareImage`, `api.js`, raw JSON dump on screen | Upload → raw cards appear |
| 40–60 | Flashcard + grid per Design doc | Flip works with mouse and keyboard |
| 60–75 | Demo mode, loading bar, error banner, Retry | Network off → "Load Example" still works |
| 75–90 | Apply full Bauhaus styling and responsive layout | Looks correct at 1440 px and 390 px widths |
| 90–105 | localStorage persistence, edge cases (§11), model fallback | All §11 cases behave as specified |
| 105–120 | Run the demo script twice, record a backup screen capture, write README | **DoD (§13) all checked** |

**Rule:** at minute 90, freeze features. Only fixes after that.

---

## 11. Edge Cases & Error Handling

| Case | Expected behavior |
|---|---|
| Wrong file type (PDF, GIF, HEIC) | Inline error "PNG or JPEG only"; state stays `idle` |
| File > 10 MB | Inline error before processing |
| Blurry / non-study image | Model returns `[]` → `BAD_MODEL_OUTPUT` banner: "Try a clearer photo" + Load Example button |
| Network failure | Banner "Can't reach server" + Retry + Load Example |
| Timeout | `TIMEOUT` banner + Retry |
| Double-click Generate | Button disabled while `loading` |
| Dropped image while loading | Ignored |
| Very long text on a card | Truncated at validation; card face scrolls internally if it still overflows |
| `localStorage` unavailable | Silently skip persistence |

---

## 12. Demo Script & Judging Alignment

**Pre-demo (2 min before):** server running, `/api/health` OK, demo image on desktop, browser zoom 100%, backup screen recording open.

**30-second path:** Empty state → drag demo image → Generate → cards appear → flip a *relationship* card ("what comes after X?") → say: "OCR would give a bag of words; Gemma 4 understood the arrows."

**Fallback path:** if anything stalls beyond 10 s → click **Load Example**. Never apologize; keep narrating.

| Judging angle | How GemmaFlash shows it |
|---|---|
| Use of Gemma 4 | Native vision on non-linear diagrams; structured JSON output; system instructions |
| Complete loop | Share → Understand → Respond → Act, all visible on one screen |
| Reliability | Demo mode, model fallback, validation layer, typed errors |
| Polish | Bauhaus design with snappy flip interaction |

---

## 13. Definition of Done
- [ ] Demo image → ≥ 6 cards → flip works, twice in a row
- [ ] Load Example works offline
- [ ] All §11 cases tested manually
- [ ] No API key in client bundle or git history
- [ ] Layout verified on desktop and mobile widths
- [ ] README with 3-line run instructions and `.env` template
- [ ] Backup screen recording saved

---

## 14. Roadmap (post-hackathon)
1. **Persistence:** accounts, decks, tags via PostgreSQL or MongoDB.
2. **Multi-page PDFs:** page-by-page processing with rolling summary context for chapter-level decks.
3. **Export:** Anki `.apkg` and Quizlet CSV.
4. **Spaced repetition:** SM-2 scheduling using the `difficulty` field as the initial ease.
5. **Streaming:** show cards as they are generated.
