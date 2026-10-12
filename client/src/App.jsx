import { useState, useEffect } from 'react';
import { prepareImage } from './lib/prepareImage.js';
import { generateCardsAPI } from './lib/api.js';
import demoDeck from './data/demoDeck.json';
import Dropzone from './components/Dropzone.jsx';
import LoadingBar from './components/LoadingBar.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import CardGrid from './components/CardGrid.jsx';

const STORAGE_KEY = 'gemmaflash.deck.v1';
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_RAW_SIZE = 10 * 1024 * 1024; // 10 MB per image
const MAX_IMAGES = 4;

const isImageFile = (file) => {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/webp' ||
    mime.startsWith('image/')
  ) {
    return true;
  }
  return (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp')
  );
};

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | ready | loading | success | error
  const [images, setImages] = useState([]); // [{ id, previewUrl, imageBase64, mimeType, name }]
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);

  // Restore deck from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setCards(parsed);
          setStatus('success');
        }
      }
    } catch (e) {
      console.warn('localStorage restore skipped:', e);
    }
  }, []);

  const saveDeck = (newCards) => {
    setCards(newCards);
    setStatus('success');
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    } catch (e) {
      console.warn('localStorage save skipped:', e);
    }
  };

  const handleAddFiles = async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    // Filter valid types (allow png, jpg, jpeg, webp by mime or extension)
    const invalidType = newFiles.find((f) => !isImageFile(f));
    if (invalidType) {
      setError({
        code: 'UNSUPPORTED_TYPE',
        message: 'PNG or JPEG only. Other formats are not supported.',
      });
      return;
    }

    // Filter valid size
    const tooLarge = newFiles.find((f) => f.size > MAX_RAW_SIZE);
    if (tooLarge) {
      setError({
        code: 'FILE_TOO_LARGE',
        message: 'One or more files exceed the 10 MB limit. Please choose smaller photos.',
      });
      return;
    }

    // Check capacity
    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setError({
        code: 'MAX_IMAGES_REACHED',
        message: 'Maximum 4 images allowed per study deck.',
      });
      return;
    }

    const filesToProcess = newFiles.slice(0, availableSlots);
    if (newFiles.length > availableSlots) {
      setError({
        code: 'PARTIAL_UPLOAD',
        message: `Only added ${availableSlots} image(s). Maximum 4 images allowed.`,
      });
    } else {
      setError(null);
    }

    try {
      const preparedBatch = await Promise.all(
        filesToProcess.map(async (file, idx) => {
          const prep = await prepareImage(file);
          return {
            id: `${Date.now()}-${idx}-${Math.random()}`,
            name: file.name,
            previewUrl: prep.previewUrl,
            imageBase64: prep.imageBase64,
            mimeType: prep.mimeType,
          };
        })
      );

      const updated = [...images, ...preparedBatch];
      setImages(updated);
      setStatus('ready');
    } catch (err) {
      console.error('Image prep failed:', err);
      setError({
        code: 'IMAGE_PREP_FAILED',
        message: 'Could not process one or more images. Try other photos.',
      });
    }
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    setError(null);
    if (updated.length === 0) {
      setStatus('idle');
    }
  };

  const handleClearImages = () => {
    setImages([]);
    setError(null);
    setStatus('idle');
  };

  const handleGenerate = async () => {
    if (status === 'loading' || images.length === 0) return;
    setStatus('loading');
    setError(null);

    try {
      const payload = images.map((img) => ({
        imageBase64: img.imageBase64,
        mimeType: img.mimeType || 'image/jpeg',
      }));

      const data = await generateCardsAPI(payload);
      saveDeck(data.cards);
    } catch (err) {
      console.error('Generation failed:', err);
      setError({
        code: err.code || 'MODEL_FAILED',
        message: err.message || 'Generation failed. Try again or use the example.',
      });
      setStatus('error');
    }
  };

  const handleLoadDemo = () => {
    saveDeck(demoDeck);
    setImages([]);
    setError(null);
  };

  const handleReset = () => {
    setStatus('idle');
    setImages([]);
    setCards([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[35%_65%] min-h-screen border-ink">
        {/* Left Column: Control Panel (35%) */}
        <aside className="bg-bauhaus-yellow p-6 md:p-8 border-b-4 lg:border-b-0 lg:border-r-4 border-ink flex flex-col justify-between">
          <div className="space-y-6">
            {/* Wordmark */}
            <div className="flex items-center gap-2">
              <span className="font-black text-3xl md:text-4xl tracking-tight text-ink">GEMMA</span>
              <span className="bg-bauhaus-red text-white font-black text-3xl md:text-4xl px-2.5 py-0.5 border-2 md:border-4 border-ink shadow-hard">
                FLASH
              </span>
            </div>

            {/* Error Banner */}
            {error && (
              <ErrorBanner
                message={error.message}
                canRetry={status === 'error' && images.length > 0}
                onRetry={handleGenerate}
                onLoadExample={handleLoadDemo}
              />
            )}

            {/* Dropzone Component with Multi-Image Support */}
            <Dropzone
              images={images}
              onAddFiles={handleAddFiles}
              onRemoveImage={handleRemoveImage}
              onClearAll={handleClearImages}
              disabled={status === 'loading'}
            />

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={images.length === 0 || status === 'loading'}
                className="bg-bauhaus-red text-white font-black uppercase tracking-widest py-4 px-6 w-full border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bauhaus-yellow disabled:bg-white disabled:text-ink disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 transition-all duration-75 text-sm md:text-base"
              >
                {status === 'loading'
                  ? 'WORKING…'
                  : images.length > 0
                  ? `GENERATE CARDS (${images.length} ${images.length === 1 ? 'IMAGE' : 'IMAGES'})`
                  : 'GENERATE CARDS'}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  disabled={status === 'loading'}
                  className="flex-1 bg-white text-ink font-bold uppercase py-2 px-4 border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink text-xs tracking-wider transition-all duration-75"
                >
                  LOAD EXAMPLE
                </button>
                {(status !== 'idle' || images.length > 0) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={status === 'loading'}
                    className="bg-white text-ink font-bold uppercase py-2 px-4 border-2 md:border-4 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink text-xs tracking-wider transition-all duration-75"
                  >
                    RESET
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer Status Label */}
          <div className="text-xs font-bold uppercase tracking-widest text-ink/80 pt-6 border-t-2 border-ink mt-6 flex justify-between items-center">
            <span>STATE: {status}</span>
            <span>MULTI-IMAGE MULTIMODAL</span>
          </div>
        </aside>

        {/* Right Column: Flashcard Canvas (65%) */}
        <main className="bg-canvas bg-bauhaus-grid p-6 md:p-10 flex flex-col justify-start">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="w-full mb-8">
              <LoadingBar />
              <p className="text-sm font-bold uppercase tracking-widest text-center text-ink mt-4">
                {images.length > 1
                  ? `Gemma 4 is synthesizing concepts across all ${images.length} images…`
                  : 'Gemma 4 is reading the diagram hierarchy & arrows…'}
              </p>
            </div>
          )}

          {/* Card Presentation Canvas with 3D Flip Engine */}
          {cards.length > 0 ? (
            <CardGrid cards={cards} onReset={handleReset} />
          ) : (
            /* Empty State Hero */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="max-w-xl">
                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8 text-ink">
                  DROP DIAGRAMS.
                  <br />
                  GET FLASHCARDS.
                </h1>

                {/* Decorative Shapes */}
                <div className="flex justify-center items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-bauhaus-red border-4 border-ink shadow-hard" />
                  <div className="w-16 h-16 bg-bauhaus-blue border-4 border-ink shadow-hard" />
                  <svg className="w-16 h-16 drop-shadow-[4px_4px_0_#121212]" viewBox="0 0 32 32">
                    <polygon points="16,2 30,30 2,30" fill="#F0C020" stroke="#121212" strokeWidth="3" />
                  </svg>
                </div>

                <p className="text-sm font-bold uppercase tracking-widest text-ink">
                  Multi-page notes · Sequential flowcharts · Connected diagrams
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
