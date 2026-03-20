import React, { useCallback, useRef, useState } from 'react';

interface LandingScreenProps {
  onFileLoad: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onFileLoad, loading, error }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.name.endsWith('.json')) {
      onFileLoad(file);
    }
  }, [onFileLoad]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 animate-pulse rounded-sm" style={{ background: 'var(--color-border-bright)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Parsing crawl data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
      <div className="w-full max-w-md px-6 text-center">
        <h1
          className="mb-2 text-lg font-bold tracking-[0.2em]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          CRAWL GRAPH
        </h1>
        <p className="mb-8 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Load a JSON crawl export to visualize, annotate, and edit your site's link graph.
          Everything runs locally in your browser.
        </p>

        <div
          className="cursor-pointer rounded-md border-2 border-dashed p-10 transition-all duration-150"
          style={{
            borderColor: dragOver ? 'var(--color-text-primary)' : 'var(--color-border)',
            background: dragOver ? 'var(--bg-panel-secondary)' : 'var(--bg-panel)',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="Upload JSON file"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
        >
          <div className="mb-3 text-2xl">⬆</div>
          <p className="text-xs font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
            DROP .JSON FILE HERE
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            or click to browse
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onChange}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-md border p-3 text-left text-xs" style={{
            borderColor: 'var(--color-accent-error)',
            background: 'var(--bg-panel)',
            color: 'var(--color-accent-error)',
          }}>
            <p className="mb-1 font-bold">Parse Error</p>
            <p className="font-normal" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <button
              className="mt-2 text-xs font-bold underline"
              style={{ color: 'var(--color-text-primary)' }}
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              Try Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
