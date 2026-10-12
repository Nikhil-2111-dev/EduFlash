export default function ErrorBanner({ message, onRetry, onLoadExample, canRetry }) {
  return (
    <div
      role="alert"
      className="bg-bauhaus-red text-white border-2 md:border-4 border-ink shadow-hard p-4 font-bold"
    >
      <p className="text-sm md:text-base leading-snug mb-3">{message}</p>
      <div className="flex flex-wrap gap-2">
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-white text-ink font-bold uppercase py-1.5 px-4 border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink text-xs tracking-wider"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onLoadExample}
          className="bg-white text-ink font-bold uppercase py-1.5 px-4 border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink text-xs tracking-wider"
        >
          Load Example
        </button>
      </div>
    </div>
  );
}
