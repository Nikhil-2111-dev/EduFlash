import Flashcard from './Flashcard.jsx';

export default function CardGrid({ cards, onReset }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-8 pb-3 border-b-2 md:border-b-4 border-ink">
        <span className="text-sm font-bold uppercase tracking-widest text-ink">
          {cards.length} CARDS
        </span>
        <button
          type="button"
          onClick={onReset}
          className="bg-white text-ink font-bold uppercase py-1.5 px-4 border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink text-xs tracking-wider transition-all duration-75"
        >
          Reset Deck
        </button>
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {cards.map((card, idx) => (
          <Flashcard key={`${card.front}-${idx}`} card={card} index={idx} />
        ))}
      </div>
    </div>
  );
}
