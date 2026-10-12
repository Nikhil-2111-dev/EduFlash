# GemmaFlash — Design System (Bauhaus Edition, v2)

> **Audience:** a human builder AND a coding LLM. All values here are final; copy them exactly.
> **Companion doc:** `GemmaFlash_PRD_v2.md` (behavior, API, data). This doc never changes behavior.
> **Stack assumed:** React 18 + Vite + **Tailwind CSS 3.4** (v3 syntax: `@tailwind` directives and `tailwind.config.js`).

---

## 0. Instructions for a coding LLM
1. Set up tokens (§2) and global CSS (§9) **first**, then build components in the order of §5.
2. Use named tokens (`bg-bauhaus-red`, `shadow-hard`), not ad-hoc hex values.
3. Obey the **Hard Rules** (§1). If a rule and an example conflict, the rule wins.
4. Every interactive element needs keyboard support and a visible focus style (§7).
5. Do not add gradients, blur, rounded corners (except where §1 allows), or extra colors.

---

## 1. Design Philosophy & Hard Rules

**Concept:** a constructivist Bauhaus poster that happens to be an app. Pure geometry (circle, square, triangle), three primary colors, black ink, off-white canvas. Thick borders and hard offset shadows make cards feel like physical objects. Mechanical, legible, high-contrast.

**Hard Rules**
| # | Rule |
|---|---|
| R1 | Only these colors: Canvas, Ink, Red, Blue, Yellow, plus pure white for card/dropzone surfaces. |
| R2 | No gradients, no blur, no soft shadows. The only opacity effect allowed is the dot-grid background (10%). |
| R3 | `rounded-none` everywhere. `rounded-full` only on decorative circles and badges. |
| R4 | Borders are `border-4` on desktop, `border-2` below `md`. Always Ink. |
| R5 | Shadows are hard offsets in Ink at 100% opacity (tokens in §2.3). |
| R6 | Font is Outfit only. Headings uppercase, tight tracking. |
| R7 | Motion is snappy (≤ 250 ms) and mechanical. No bounce, no floaty easing, no spinners. |
| R8 | Text/background pairs must keep WCAG AA contrast (see §7). |

---

## 2. Tokens

### 2.1 Colors
| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#F0F0F0` | Page background |
| `ink` | `#121212` | Text, borders, shadows |
| `bauhaus-red` | `#D02020` | Primary action, card backs (even) |
| `bauhaus-blue` | `#1040C0` | Dropzone hover, card backs (odd) |
| `bauhaus-yellow` | `#F0C020` | Control panel, tags |
| `white` | `#FFFFFF` | Card fronts, dropzone surface |

Text pairings: Ink on Canvas/White/Yellow; White on Red/Blue. Never Ink on Red/Blue, never White on Yellow.

### 2.2 `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F0F0F0',
        ink: '#121212',
        'bauhaus-red': '#D02020',
        'bauhaus-blue': '#1040C0',
        'bauhaus-yellow': '#F0C020',
      },
      fontFamily: { sans: ['Outfit', 'system-ui', 'sans-serif'] },
      boxShadow: {
        hard: '4px 4px 0 0 #121212',       // buttons, small items
        'hard-lg': '8px 8px 0 0 #121212',  // cards, dropzone
        'hard-xl': '12px 12px 0 0 #121212',// card hover
      },
      keyframes: {
        load: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(350%)' } },
      },
      animation: { load: 'load 1.1s linear infinite' },
    },
  },
  plugins: [],
};
```

### 2.3 Borders, radii, shadows
- Border: `border-2 md:border-4 border-ink`.
- Shadow on mobile may be reduced to `shadow-hard` for cards to save space.
- Radius: `rounded-none` default.

### 2.4 Typography (Outfit 400/500/700/900)
| Role | Classes |
|---|---|
| Hero / empty state | `text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]` |
| Section label | `text-sm font-bold uppercase tracking-widest` |
| Card front (question) | `text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight` |
| Card back (answer) | `text-base md:text-lg font-medium leading-relaxed` |
| Tag / badge | `text-xs font-bold uppercase tracking-widest` |
| Button | `font-black uppercase tracking-widest` (primary), `font-bold uppercase` (secondary) |

---

## 3. Layout

- Page wrapper: `min-h-screen bg-canvas text-ink font-sans`; inner container `max-w-7xl mx-auto`.
- **Desktop (≥ `lg`):** two columns, `grid-cols-[35%_65%]`, full-height, columns separated by a `border-r-4 border-ink`.
- **Mobile / tablet (< `lg`):** single column; Control Panel on top, Canvas below.

| Column | Background | Content |
|---|---|---|
| Left — Control Panel (35%) | `bg-bauhaus-yellow`, `p-6 md:p-8` | Wordmark, Dropzone, Generate button, Load Example button, error banner |
| Right — Flashcard Canvas (65%) | `bg-canvas bg-bauhaus-grid`, `p-6 md:p-10` | Empty-state hero, loading bar, or card grid |

**Wordmark:** "GEMMA" in Ink + "FLASH" in a Red box with white text, `font-black text-3xl uppercase`.

**Card grid:** `grid grid-cols-1 sm:grid-cols-2 gap-8` (gap leaves room for hard shadows). Two columns max, so card text stays legible.

---

## 4. Screen States

| State | Left panel | Right canvas |
|---|---|---|
| `idle` | Dropzone (idle), Generate disabled, Load Example enabled | Hero: "DROP A DIAGRAM. GET FLASHCARDS." over dot grid, with decorative shapes (see §5.8) |
| `ready` | Dropzone shows image preview, Generate enabled | Same as idle |
| `loading` | Generate disabled and shows "WORKING…", Dropzone locked | `LoadingBar` at top; skeleton blocks (white boxes with ink border, no pulse) |
| `success` | Preview stays; Generate re-enabled (regenerate) | Card grid; header row with card count and "Reset" button |
| `error` | `ErrorBanner` visible; Retry + Load Example available | Previous canvas content stays |

---

## 5. Components

### 5.1 Dropzone
Mechanical input slot.
- Container: `relative overflow-hidden bg-white border-2 md:border-4 border-ink shadow-hard-lg p-6 md:p-8 min-h-[260px] md:aspect-square flex flex-col justify-center transition-colors duration-100`.
- Text: "DROP IMAGE" `font-black uppercase text-4xl md:text-5xl leading-[0.9]`, plus helper `text-xs font-bold uppercase tracking-widest`: "PNG or JPG · max 10 MB · or click".
- **Drag-over / hover:** `bg-bauhaus-blue text-white` (border stays Ink).
- **Has image:** show preview as `object-contain` inside a white frame with a small "REPLACE" corner badge (yellow box, ink border).
- **Error (bad file):** keep idle visuals, show error text in a Red box, white text, below the dropzone.
- Decoration (bottom-right, `pointer-events-none`): Red circle (`w-16 h-16 rounded-full bg-bauhaus-red border-2 md:border-4 border-ink`) overlapped by a Blue triangle (SVG polygon, ink stroke). Hide decoration when an image preview is shown.
- Accessibility: wrap in a `<label>` with a hidden `<input type="file" accept="image/png,image/jpeg">`; the label has `tabIndex=0` and `focus-visible` ring (§7).

### 5.2 Buttons
Base: `border-2 md:border-4 border-ink shadow-hard uppercase transition-all duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bauhaus-yellow`.

| Variant | Extra classes |
|---|---|
| Primary (Generate Cards) | `bg-bauhaus-red text-white font-black tracking-widest py-4 px-8 w-full` |
| Secondary (Load Example, Reset, Retry) | `bg-white text-ink font-bold py-2 px-4` |
| Disabled | `disabled:bg-white disabled:text-ink disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1` and show a diagonal-stripe-free flat look (no opacity) |

### 5.3 LoadingBar
Hard-edged indeterminate bar (no spinner):
```jsx
export default function LoadingBar() {
  return (
    <div role="status" aria-live="polite" className="relative h-6 w-full overflow-hidden bg-white border-2 md:border-4 border-ink">
      <div className="absolute inset-y-0 left-0 w-1/4 bg-ink animate-load" />
      <span className="sr-only">Generating flashcards</span>
    </div>
  );
}
```

### 5.4 ErrorBanner
`bg-bauhaus-red text-white border-2 md:border-4 border-ink shadow-hard p-4 font-bold` with `role="alert"`. Contains the message and a Secondary button row: **Retry**, **Load Example**.

### 5.5 Tag & Difficulty badges
- **Tag** (front, top-left): `absolute top-0 left-0 bg-bauhaus-yellow text-ink border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest`.
- **Difficulty** (front, top-right): 3 small squares (`w-3 h-3 border-2 border-ink`), filled Ink for the level (easy = 1, medium = 2, hard = 3), white otherwise. Add `aria-label="Difficulty: medium"`.

### 5.5b Decorative shape (front, bottom-right)
8×8 (32 px) shape cycling by card index `i % 3`: Red circle, Blue square, Yellow triangle (inline SVG). `aria-hidden="true"`.

### 5.6 Flashcard
**Structure rule (important):** hover lift is applied to an **outer** wrapper; the 3D flip is applied to an **inner** element. Putting both transforms on one element causes the hover to fight the rotation.

Dimensions: `aspect-[4/3] min-h-[240px]`. If text overflows, the face body gets `overflow-y-auto`.

**Front:** `bg-white text-ink`, border + `shadow-hard-lg`; question centered with `p-8 pt-12`; Tag top-left; Difficulty top-right; shape bottom-right.
**Back:** background alternates by index (even = `bg-bauhaus-red`, odd = `bg-bauhaus-blue`), `text-white`, same border/shadow; answer left-aligned, `p-8`; small "TAP TO FLIP BACK" label bottom-left in `text-xs font-bold uppercase tracking-widest`.

**Motion:** flip 250 ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`; hover lift `-translate-y-2` over 200 ms and shadow grows to `shadow-hard-xl` (use the group-hover utility on faces). Under `prefers-reduced-motion`, no transition.

**Reference component**
```jsx
import { useState } from 'react';

const SHAPES = ['circle', 'square', 'triangle'];

function Shape({ type }) {
  const common = 'absolute bottom-3 right-3 w-8 h-8';
  if (type === 'circle') return <div aria-hidden className={`${common} rounded-full bg-bauhaus-red border-2 border-ink`} />;
  if (type === 'square') return <div aria-hidden className={`${common} bg-bauhaus-blue border-2 border-ink`} />;
  return (
    <svg aria-hidden className={common} viewBox="0 0 32 32">
      <polygon points="16,2 30,30 2,30" fill="#F0C020" stroke="#121212" strokeWidth="3" />
    </svg>
  );
}

export default function Flashcard({ card, index }) {
  const [flipped, setFlipped] = useState(false);
  const backColor = index % 2 === 0 ? 'bg-bauhaus-red' : 'bg-bauhaus-blue';
  const level = { easy: 1, medium: 2, hard: 3 }[card.difficulty] ?? 2;
  const face = 'absolute inset-0 backface-hidden border-2 md:border-4 border-ink shadow-hard md:shadow-hard-lg group-hover:shadow-hard-xl transition-shadow duration-200';

  return (
    <div className="group [perspective:1200px] transition-transform duration-200 ease-out hover:-translate-y-2">
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? `Answer: ${card.back}. Press to show question.` : `Question: ${card.front}. Press to reveal answer.`}
        onClick={() => setFlipped((f) => !f)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
      >
        <div
          className={`relative w-full aspect-[4/3] min-h-[240px] preserve-3d transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${flipped ? 'rotate-y-180' : ''}`}
        >
          {/* FRONT */}
          <div className={`${face} bg-white text-ink flex items-center p-8 pt-12`}>
            <span className="absolute top-0 left-0 bg-bauhaus-yellow border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest">
              {card.tag}
            </span>
            <span className="absolute top-3 right-3 flex gap-1" aria-label={`Difficulty: ${card.difficulty}`}>
              {[1, 2, 3].map((n) => (
                <i key={n} className={`block w-3 h-3 border-2 border-ink ${n <= level ? 'bg-ink' : 'bg-white'}`} />
              ))}
            </span>
            <p className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight overflow-y-auto max-h-full">
              {card.front}
            </p>
            <Shape type={SHAPES[index % 3]} />
          </div>

          {/* BACK */}
          <div className={`${face} ${backColor} text-white rotate-y-180 flex items-center p-8`}>
            <p className="text-base md:text-lg font-medium leading-relaxed overflow-y-auto max-h-full">{card.back}</p>
            <span className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-widest">Tap to flip back</span>
          </div>
        </div>
      </button>
    </div>
  );
}
```

### 5.7 CardGrid
Maps `cards` to `<Flashcard key={`${card.front}-${i}`} />`. A header row above shows `{n} CARDS` (section-label style) on the left and a Secondary "Reset" button on the right. Cards stagger in with a 60 ms step (`animation-delay`) using an instant `opacity` 0→1 + `translateY(8px)→0` over 150 ms. This is the only fade allowed, for entrance only, and is disabled under reduced motion.

### 5.8 Empty-state hero (right canvas, idle/ready)
Centered stack: hero text (§2.4) in Ink; beneath it, three shapes in a row (Red circle, Blue square, Yellow triangle, each 56–72 px, ink border); caption "Handwritten notes · Whiteboards · Flowcharts" in section-label style.

---

## 6. Motion Summary
| Element | Duration / easing |
|---|---|
| Button press | 75 ms, translate 4 px + remove shadow |
| Dropzone hover | 100 ms color swap |
| Card hover lift | 200 ms ease-out |
| Card flip | 250 ms `cubic-bezier(0.2,0.8,0.2,1)` |
| Loading bar | 1.1 s linear loop |
| Card entrance | 150 ms, staggered 60 ms |

All motion is disabled by `prefers-reduced-motion: reduce`.

---

## 7. Accessibility
- **Contrast:** Ink on Canvas/White/Yellow and White on Red/Blue pass AA for body text. Never place Ink text on Red/Blue or White text on Yellow.
- **Keyboard:** the card is a `<button>`, so Enter/Space flip it. Dropzone label is focusable and opens the file picker with Enter/Space.
- **Focus:** `focus-visible:ring-4 ring-ink` with offset; never remove outlines without replacement.
- **Screen readers:** loading bar uses `role="status"`; errors use `role="alert"`; decorative shapes are `aria-hidden`.
- **Touch targets:** all buttons ≥ 44 px tall.
- **Reduced motion:** honor `prefers-reduced-motion`.

---

## 8. Responsive Rules
| Breakpoint | Behavior |
|---|---|
| < 640 px | Single column everywhere; borders `border-2`; hero `text-5xl`; card grid 1 col |
| 640–1023 px | Single page column; card grid 2 cols |
| ≥ 1024 px | 35/65 split; borders `border-4`; hero `text-8xl` |

Left panel on mobile should keep Generate visible without scrolling after an image is chosen (place Generate directly under the dropzone).

---

## 9. Global Setup

### 9.1 `client/index.html` (head)
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap" rel="stylesheet" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
(Loading the font via `<link>` avoids `@import` ordering problems in Tailwind builds.)

### 9.2 `client/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { -webkit-tap-highlight-color: transparent; }
  body { @apply font-sans bg-canvas text-ink antialiased; }
}

@layer utilities {
  /* Dot grid: 10% opacity is the single allowed opacity effect (R2) */
  .bg-bauhaus-grid {
    background-image: radial-gradient(rgba(18, 18, 18, 0.1) 2px, transparent 2px);
    background-size: 24px 24px;
  }
  /* 3D flip */
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## 10. Build Order for Components
1. Tokens + global CSS → render a Canvas page with the grid.
2. `Flashcard` (use §5.6 code) with `demoDeck.json` → verify flip, hover, both faces.
3. `CardGrid` + page layout (§3).
4. `Dropzone` + buttons.
5. `LoadingBar`, `ErrorBanner`, empty-state hero.
6. Responsive pass (§8), accessibility pass (§7).

---

## 11. 30-Second Demo Choreography
| T | Screen | Visual effect |
|---|---|---|
| 0 s | Idle: yellow panel, white dropzone, dotted empty canvas with hero | Stark, high-contrast poster |
| ~5 s | Image dropped: dropzone shows preview; Generate button turns active | Blue flash on drag-over |
| ~8 s | Generate pressed | Button "clicks" (4 px press); black loading bar sweeps the canvas top |
| ~15–20 s | Cards arrive | Staggered entrance; sudden Red/Blue/Yellow color + hard shadows |
| ~25 s | Click a card | 250 ms flip reveals color-blocked answer |

---

## 12. Visual QA Checklist
- [ ] Only the six approved colors appear; no gradients or blur
- [ ] All borders Ink; 4 px desktop, 2 px mobile
- [ ] Shadows are hard offsets, no blur, 100% Ink
- [ ] Card flip shows no mirrored text and no flicker; backface hidden
- [ ] Hover lift does not break the flip
- [ ] Long question and long answer text stay inside the card (scrolls inside if needed)
- [ ] Keyboard-only run-through: tab to dropzone, Generate, cards; flip with Enter/Space
- [ ] Looks correct at 1440 px and 390 px widths
- [ ] Reduced-motion setting disables animations
