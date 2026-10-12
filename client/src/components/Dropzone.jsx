import { useState, useRef } from 'react';

export default function Dropzone({
  images = [],
  onAddFiles,
  onRemoveImage,
  onClearAll,
  disabled = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      onAddFiles(Array.from(droppedFiles));
    }
  };

  const handleChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onAddFiles(Array.from(selectedFiles));
    }
    if (e.target) e.target.value = '';
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        id="diagram-file-input"
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Upload diagram images"
      />

      {images.length === 0 ? (
        /* Empty State: Mechanical Drop Slot */
        <label
          htmlFor="diagram-file-input"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden border-2 md:border-4 border-ink shadow-hard-lg p-6 md:p-8 min-h-[260px] md:aspect-square flex flex-col justify-center cursor-pointer transition-colors duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bauhaus-yellow ${
            disabled
              ? 'cursor-not-allowed bg-white/70'
              : isDragOver
              ? 'bg-bauhaus-blue text-white'
              : 'bg-white text-ink hover:bg-bauhaus-blue hover:text-white group'
          }`}
        >
          <div className="flex flex-col justify-center items-start text-left z-10 pointer-events-none">
            <span className="font-black uppercase text-4xl md:text-5xl leading-[0.9] tracking-tight mb-3">
              DROP
              <br />
              IMAGES
            </span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-90">
              PNG or JPG · 1 to 4 images · or click
            </span>
          </div>

          {/* Decorative Bauhaus shapes in bottom-right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 right-4 flex items-center"
          >
            <div className="w-16 h-16 rounded-full bg-bauhaus-red border-2 md:border-4 border-ink shadow-hard" />
            <svg className="-ml-8 w-16 h-16 drop-shadow-[2px_2px_0_#121212]" viewBox="0 0 32 32">
              <polygon points="16,2 30,30 2,30" fill="#1040C0" stroke="#121212" strokeWidth="2.5" />
            </svg>
          </div>
        </label>
      ) : (
        /* Multi-Image Gallery */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 md:border-4 border-ink shadow-hard-lg p-4 bg-white transition-colors duration-100 ${
            isDragOver ? 'bg-bauhaus-blue/10 border-bauhaus-blue' : 'bg-white'
          }`}
        >
          {/* Gallery Header */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-ink">
            <span className="text-xs font-black uppercase tracking-wider text-ink">
              {images.length}/4 IMAGES LOADED
            </span>
            <button
              type="button"
              onClick={onClearAll}
              disabled={disabled}
              className="text-xs font-bold uppercase underline hover:text-bauhaus-red text-ink transition-colors"
            >
              CLEAR ALL
            </button>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative bg-canvas border-2 border-ink shadow-hard p-2 flex flex-col items-center justify-center min-h-[110px]"
              >
                {/* Image Index Badge */}
                <span className="absolute top-1 left-1 bg-bauhaus-yellow text-ink border border-ink text-[10px] font-black uppercase px-1.5 py-0.5 shadow-[1px_1px_0_#121212]">
                  IMG {idx + 1}
                </span>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(idx);
                  }}
                  disabled={disabled}
                  aria-label={`Remove image ${idx + 1}`}
                  className="absolute top-1 right-1 w-5 h-5 bg-bauhaus-red text-white border border-ink font-black text-xs flex items-center justify-center shadow-[1px_1px_0_#121212] active:translate-x-0.5 active:translate-y-0.5 hover:bg-ink transition-colors"
                >
                  ✕
                </button>

                <img
                  src={img.previewUrl}
                  alt={`Input diagram ${idx + 1}`}
                  className="max-h-20 max-w-full object-contain mt-3"
                />
              </div>
            ))}

            {/* Add More Slot if less than 4 */}
            {images.length < 4 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="border-2 border-dashed border-ink bg-white/60 hover:bg-bauhaus-yellow transition-colors p-3 flex flex-col items-center justify-center min-h-[110px] cursor-pointer shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span className="text-2xl font-black text-ink leading-none mb-1">+</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink">
                  ADD IMAGE
                </span>
              </button>
            )}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/70 text-center">
            {images.length < 4
              ? 'Click "+ ADD" or drag files to add more'
              : 'Maximum 4 images reached'}
          </p>
        </div>
      )}
    </div>
  );
}
