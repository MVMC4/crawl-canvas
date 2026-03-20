import React, { useMemo, useState, useCallback, useRef } from 'react';
import { CrawlRecord, NodeDiff } from '@/types/crawl';
import { getContentTypeLabel } from '@/lib/contentTypeUtils';

interface BookmarksPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: string[];
  records: CrawlRecord[];
  diffs: Record<string, NodeDiff>;
  onSelect: (url: string) => void;
  onRemove: (url: string) => void;
}

interface BookmarkPosition {
  x: number;
  y: number;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  open, onClose, bookmarks, records, diffs, onSelect, onRemove,
}) => {
  const recordMap = useMemo(() => new Map(records.map(r => [r.url, r])), [records]);

  // Track dragged positions per URL
  const [positions, setPositions] = useState<Record<string, BookmarkPosition>>({});
  const dragRef = useRef<{ url: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const didDrag = useRef(false);

  // Compute default positions
  const defaults = useMemo(() => {
    const map: Record<string, BookmarkPosition> = {};
    bookmarks.forEach((url, i) => {
      const angle = (i / Math.max(bookmarks.length, 1)) * Math.PI * 2 + Math.PI / 6;
      const radius = 60 + (i % 3) * 40;
      map[url] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    return map;
  }, [bookmarks]);

  const getPos = (url: string): BookmarkPosition => positions[url] || defaults[url] || { x: 0, y: 0 };

  const handlePointerDown = useCallback((e: React.PointerEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = positions[url] || defaults[url] || { x: 0, y: 0 };
    dragRef.current = { url, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    didDrag.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [positions, defaults]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setPositions(prev => ({
      ...prev,
      [dragRef.current!.url]: {
        x: dragRef.current!.origX + dx,
        y: dragRef.current!.origY + dy,
      },
    }));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent, url: string) => {
    if (!didDrag.current) {
      onSelect(url);
    }
    dragRef.current = null;
  }, [onSelect]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ background: 'var(--bg-canvas)' }}
      onPointerMove={handlePointerMove}
    >
      {/* Header */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-lg px-4 py-2"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <span className="text-[11px] font-bold tracking-wider" style={{ color: '#f5c518' }}>★</span>
        <span className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          BOOKMARKS ({bookmarks.length})
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            No bookmarks yet. Click ☆ on a node to add one.
          </p>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {bookmarks.map((url) => {
            const { x, y } = getPos(url);
            const r = recordMap.get(url);
            const diff = diffs[url];
            const label = diff?.nickname || r?.page_title || url.slice(0, 30);
            let shortPath = '';
            try { shortPath = new URL(url).pathname; } catch { shortPath = url; }

            return (
              <div
                key={url}
                className="absolute group select-none"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  cursor: dragRef.current?.url === url ? 'grabbing' : 'grab',
                }}
                onPointerDown={(e) => handlePointerDown(e, url)}
                onPointerUp={(e) => handlePointerUp(e, url)}
              >
                {/* Node dot */}
                <div
                  className="rounded-full mx-auto"
                  style={{
                    width: 10,
                    height: 10,
                    background: '#f5c518',
                    boxShadow: '0 0 8px #f5c51866',
                    border: '1px solid #f5c518',
                    pointerEvents: 'none',
                  }}
                />
                {/* Card below */}
                <div
                  className="mt-1.5 rounded px-2 py-1.5 transition-all duration-150"
                  style={{
                    minWidth: 120,
                    maxWidth: 180,
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    pointerEvents: 'none',
                  }}
                >
                  <p
                    className="text-[8px] font-bold truncate"
                    style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Mono', monospace" }}
                  >
                    {label}
                  </p>
                  <p className="text-[7px] truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {shortPath}
                  </p>
                  {r && (
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[7px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {getContentTypeLabel(r.content_type)}
                      </span>
                      <span className="text-[7px]" style={{ color: 'var(--color-text-secondary)' }}>
                        d:{r.depth}
                      </span>
                    </div>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'var(--bg-panel-secondary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    pointerEvents: 'auto',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
