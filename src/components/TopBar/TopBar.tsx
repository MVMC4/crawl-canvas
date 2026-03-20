import React, { useMemo, useRef, useState, useEffect } from 'react';
import { CrawlRecord, NodeDiff } from '@/types/crawl';

interface TopBarProps {
  projectName: string;
  onToggleBookmarks: () => void;
  onOpenInfo: () => void;
  onToggleDirection: () => void;
  onToggleTheme: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onLoadFile: () => void;
  theme: 'dark' | 'light';
  direction: 'TB' | 'LR';
  bookmarkCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  records: CrawlRecord[];
  diffs: Record<string, NodeDiff>;
  onNavigateToNode: (url: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName, onToggleBookmarks, onOpenInfo,
  onToggleDirection, onToggleTheme, onExportJson, onExportPng,
  onLoadFile, theme, direction, bookmarkCount, searchQuery, onSearchChange,
  records, diffs, onNavigateToNode,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return records.filter(r => {
      const nick = diffs[r.url]?.nickname || '';
      return (
        r.url.toLowerCase().includes(q) ||
        (r.page_title?.toLowerCase().includes(q)) ||
        nick.toLowerCase().includes(q)
      );
    }).slice(0, 12);
  }, [searchQuery, records, diffs]);

  const showResults = searchFocused && searchResults.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      className="flex h-12 items-center justify-between px-3 transition-theme"
      style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold tracking-[0.2em]" style={{ color: 'var(--color-text-primary)' }}>
          CRAWL GRAPH
        </span>
        <div className="h-4 w-px" style={{ background: 'var(--color-border)' }} />
        <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          {projectName || 'Untitled'}
        </span>
        <button
          onClick={onLoadFile}
          className="rounded px-2 py-1 text-[10px] font-bold transition-colors"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          aria-label="Load file"
        >
          Load File
        </button>
      </div>

      {/* Center — Search with dropdown */}
      <div className="flex-1 flex justify-center px-4 relative">
        <div className="relative w-full max-w-sm">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search URLs, titles…"
            className="w-full rounded px-3 py-1.5 text-[11px] outline-none transition-all"
            style={{
              background: 'var(--bg-panel-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            aria-label="Search"
          />
          {showResults && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1 rounded border overflow-y-auto z-[60]"
              style={{
                background: 'var(--bg-panel)',
                borderColor: 'var(--color-border)',
                maxHeight: 280,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <div className="px-2 py-1 text-[9px] font-bold tracking-wider" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''}
              </div>
              {searchResults.map(r => {
                const nick = diffs[r.url]?.nickname;
                let displayUrl = r.url;
                try { displayUrl = new URL(r.url).pathname; } catch {}
                return (
                  <button
                    key={r.url}
                    className="block w-full text-left px-3 py-2 text-[10px] transition-colors hover:opacity-80"
                    style={{
                      color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-border)',
                      background: 'transparent',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onNavigateToNode(r.url);
                      setSearchFocused(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: '#22c55e' }}
                      />
                      <span className="truncate font-bold" style={{ maxWidth: 200 }}>
                        {nick || r.page_title || displayUrl}
                      </span>
                      <span
                        className="text-[8px] ml-auto flex-shrink-0"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {r.status_code || 'ERR'} · d{r.depth}
                      </span>
                    </div>
                    <div className="truncate mt-0.5" style={{ color: 'var(--color-text-secondary)', fontSize: 9 }}>
                      {r.url}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <ToolbarBtn onClick={onToggleBookmarks} label={`Bookmarks (${bookmarkCount})`}>
          ☆ <span className="text-[9px] ml-0.5">{bookmarkCount}</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={onOpenInfo} label="Info">ℹ</ToolbarBtn>
        <ToolbarBtn onClick={onToggleDirection} label="Toggle direction">
          {direction === 'TB' ? '↕' : '↔'}
        </ToolbarBtn>
        <ToolbarBtn onClick={onToggleTheme} label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </ToolbarBtn>
        <div className="relative">
          <ToolbarBtn onClick={() => setExportOpen(!exportOpen)} label="Export">⬇</ToolbarBtn>
          {exportOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded border py-1 text-[10px] z-50"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--color-border)', minWidth: 160 }}
            >
              <button
                className="block w-full px-3 py-1.5 text-left hover:opacity-70"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => { onExportJson(); setExportOpen(false); }}
              >
                Export JSON (edited_export.json)
              </button>
              <button
                className="block w-full px-3 py-1.5 text-left hover:opacity-70"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => { onExportPng(); setExportOpen(false); }}
              >
                Export PNG (current view)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolbarBtn: React.FC<{ onClick: () => void; label: string; active?: boolean; children: React.ReactNode }> = ({
  onClick, label, active, children,
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="flex items-center gap-0.5 rounded px-2 py-1 text-[12px] transition-colors"
    style={{
      background: active ? 'var(--bg-panel-secondary)' : 'transparent',
      color: 'var(--color-text-primary)',
      border: active ? '1px solid var(--color-border)' : '1px solid transparent',
    }}
  >
    {children}
  </button>
);
