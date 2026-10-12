# GemmaFlash ⚡️

> **Turn whiteboard diagrams, handwritten notes, and flowcharts into active-recall flashcards using Gemma 4's multimodal spatial reasoning.**
> 
> *Built for Hacktoberfest Hack Day Hyderabad (MLH x NIAT – KKH)*  
> *Category: **Best Use of Gemma 4***

---

## 🚀 Overview

Study material is frequently visual and non-linear: architecture diagrams, margin notes, flowchart branches, and whiteboard scribbles. Traditional OCR flattens this information into an unstructured bag of words, completely losing the critical context of **arrows, dependencies, sequence, and spatial hierarchy**.

**GemmaFlash** leverages **Gemma 4**'s native vision and reasoning capabilities to understand what points to what. It extracts both handwritten labels and the structural relationships between concepts, transforming complex diagrams into high-retention active-recall flashcards with a tactile 3D Bauhaus interface.

---

## 🎨 Bauhaus Design System

GemmaFlash is designed as a constructivist Bauhaus poster that functions as a high-performance web app:
- **Strict 6-Color Palette:** Off-White Canvas (`#F0F0F0`), Black Ink (`#121212`), Bauhaus Red (`#D02020`), Bauhaus Blue (`#1040C0`), Bauhaus Yellow (`#F0C020`), and White (`#FFFFFF`).
- **Physicality:** Mechanical button depressions (4px offset), hard-edged shadows (`100%` ink opacity), and bold 4px borders.
- **Snappy 3D Interaction:** Mechanical 250ms card flip revealing color-blocked back faces, with full keyboard accessibility (Tab, Enter, Space).
- **Zero Fluff:** No soft blurs, no gradients, no floaty easing, no rounded corners (`rounded-none`).

---

## 🏗️ Architecture

```
EduFlash/
├── client/                     # React 18 + Vite 5 + Tailwind CSS 3.4
│   ├── src/
│   │   ├── lib/prepareImage.js # In-browser canvas downscale (≤ 1568px) & JPEG encoding
│   │   ├── lib/api.js          # REST client with typed error contracts
│   │   ├── data/demoDeck.json  # Bundled offline backup deck (TCP handshake)
│   │   ├── components/         # Dropzone, Flashcard (3D flip), CardGrid, LoadingBar, ErrorBanner
│   │   └── App.jsx             # Finite state machine (idle -> ready -> loading -> success / error)
│   └── vite.config.js          # Reverse proxy: /api -> http://localhost:8787
└── server/                     # Node.js 20+ Express API
    ├── server.js               # @google/genai SDK integration & validation pipeline
    └── .env                    # Model selection & GEMINI_API_KEY
```

### AI Pipeline & Resilience Contract
1. **Multi-Image Multimodal Reasoning:** Accepts 1 to 4 images in a shared context (multi-page notes, sequential flowcharts, interconnected diagrams). Constructs multi-part `inlineData` inputs for `gemma-4-26b-a4b-it`.
2. **Mandatory Coverage & Cross-Diagram Synthesis:** Guarantees at least one card testing each individual image plus dedicated cards testing sequence transitions and dependencies between images.
3. **Dual-Model Fallback:** If the primary model times out or encounters upstream errors, requests automatically fall back to dense `gemma-4-31b-it`.
4. **Structured Schema Guarantee:** Employs tolerant regex and substring parsing (`[` to `]`) with card deduplication, length capping, and validation checks.
5. **Offline Resilience:** One-click **"LOAD EXAMPLE"** instantly loads pre-baked TCP handshake cards with **zero network dependency**.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 20+
- A Google Gemini API Key

### 2. Server Setup
```bash
cd server
npm install

# Create server/.env with your API credentials
cat <<EOF > .env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8787
CLIENT_ORIGIN=http://localhost:5173
PRIMARY_MODEL=gemma-4-26b-a4b-it
FALLBACK_MODEL=gemma-4-31b-it
TIMEOUT_MS=35000
EOF

npm run dev
# Server listening on http://localhost:8787
```

### 3. Client Setup
In a new terminal:
```bash
cd client
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🎬 30-Second Demo Script & Judging Alignment

| Time | Action | Visual Effect | Pitch Talking Point |
|---|---|---|---|
| **0s** | Start on `idle` state | High-contrast Bauhaus poster with empty canvas | *"GemmaFlash bridges visual study diagrams and active-recall learning."* |
| **5s** | Drop diagram photo | Dropzone flashes Bauhaus Blue; thumbnail appears | *"Diagram uploaded. Browser canvas optimizes resolution below 1568px."* |
| **8s** | Click **Generate Cards** | Button clicks down 4px; mechanical black progress bar sweeps | *"Gemma 4 analyzes both handwriting and structural diagram arrows."* |
| **18s** | Cards arrive in 3D grid | Staggered card entrance with topic tags & difficulty levels | *"In under 20 seconds, we get 6 to 10 structured active-recall cards."* |
| **25s** | Flip relationship card | 250ms 3D flip reveals color-blocked answer | *"Notice this card tests sequence: 'What happens after SYN?' Plain OCR loses arrows; Gemma 4 understands relationships."* |
| **Fallback** | If venue Wi-Fi stutters | Click **Load Example** | *"Zero network reliance — demo deck loads instantly offline."* |

---

## 🏆 Hackathon Judging Alignment

| Judging Dimension | How GemmaFlash Delivers |
|---|---|
| **Best Use of Gemma 4** | Multimodal spatial reasoning on complex non-linear flowcharts; understands arrow directions and state sequences that plain text OCR misses. |
| **Complete Product Loop** | **Share** (drop image) → **Understand** (Gemma 4 vision) → **Respond** (structured JSON) → **Act** (interactive 3D flip test). |
| **Reliability & Polish** | Instant offline fallback, dual-model failover, tolerant parser, WCAG AA contrast, and snappy 3D Bauhaus aesthetic. |
| **Performance** | In-browser canvas pre-processing (≤ 1568px) keeps payload light; sub-20s generation time. |

---

## 📜 License
MIT © 2026 Hacktoberfest Hyderabad Team
