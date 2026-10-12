import { useState } from 'react';

const SHAPES = ['circle', 'square', 'triangle'];

function Shape({ type }) {
  const common = 'absolute bottom-3 right-3 w-8 h-8';
  if (type === 'circle') {
    return <div aria-hidden className={`${common} rounded-full bg-bauhaus-red border-2 border-ink`} />;
  }
  if (type === 'square') {
    return <div aria-hidden className={`${common} bg-bauhaus-blue border-2 border-ink`} />;
  }
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
  const face =
    'absolute inset-0 backface-hidden border-2 md:border-4 border-ink shadow-hard md:shadow-hard-lg group-hover:shadow-hard-xl transition-shadow duration-200';

  return (
    <div
      className="group [perspective:1200px] transition-transform duration-200 ease-out hover:-translate-y-2 animate-card-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={
          flipped
            ? `Answer: ${card.back}. Press to show question.`
            : `Question: ${card.front}. Press to reveal answer.`
        }
        onClick={() => setFlipped((f) => !f)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
      >
        <div
          className={`relative w-full aspect-[4/3] min-h-[240px] preserve-3d transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div className={`${face} bg-white text-ink flex items-center p-8 pt-12`}>
            <span className="absolute top-0 left-0 bg-bauhaus-yellow border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest">
              {card.tag || 'General'}
            </span>
            <span
              className="absolute top-3 right-3 flex gap-1"
              aria-label={`Difficulty: ${card.difficulty}`}
            >
              {[1, 2, 3].map((n) => (
                <i
                  key={n}
                  className={`block w-3 h-3 border-2 border-ink ${
                    n <= level ? 'bg-ink' : 'bg-white'
                  }`}
                />
              ))}
            </span>
            <p className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight overflow-y-auto max-h-full">
              {card.front}
            </p>
            <Shape type={SHAPES[index % 3]} />
          </div>

          {/* BACK */}
          <div className={`${face} ${backColor} text-white rotate-y-180 flex items-center p-8`}>
            <p className="text-base md:text-lg font-medium leading-relaxed overflow-y-auto max-h-full">
              {card.back}
            </p>
            <span className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-widest opacity-90">
              Tap to flip back
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
