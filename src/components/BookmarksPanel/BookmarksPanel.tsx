import React from 'react';
import { CrawlRecord, NodeDiff } from '@/types/crawl';

interface BookmarksPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: string[];
  records: CrawlRecord[];
  diffs: Record<string, NodeDiff>;
  onNavigate: (url: string) => void;
  onRemove: (url: string) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  open, onClose, bookmarks, records, diffs, onNavigate, onRemove,
}) => {
  if (!open) return null;

  const recordMap = new Map(records.map(r => [r.url, r]));

  return (
    <div
      className="fixed left-0 top-[72px] h-[calc(100%-72px)] overflow-y-auto z-30"
      style={{
        width: 300,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Bookmarks ({bookmarks.length})
        </span>
        <button onClick={onClose} className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>×</button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="p-3 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>No bookmarks yet. Click ☆ on a node to add one.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {bookmarks.map(url => {
            const r = recordMap.get(url);
            const diff = diffs[url];
            const label = diff?.nickname || r?.page_title || url.slice(0, 40);
            return (
              <div
                key={url}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:opacity-80"
                onClick={() => onNavigate(url)}
              >
                <span style={{ color: '#f5c518' }}>★</span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
                </div>
                {r && (
                  <span className="text-[9px] rounded px-1" style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-secondary)' }}>
                    {r.status_code ?? 'ERR'}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                  className="text-[12px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                  aria-label="Remove bookmark"
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
