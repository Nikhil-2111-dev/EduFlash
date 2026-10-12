export default function LoadingBar() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative h-6 w-full overflow-hidden bg-white border-2 md:border-4 border-ink shadow-hard"
    >
      <div className="absolute inset-y-0 left-0 w-1/4 bg-ink animate-load" />
      <span className="sr-only">Generating flashcards</span>
    </div>
  );
}
