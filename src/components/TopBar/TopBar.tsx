import React from 'react';

interface TopBarProps {
  projectName: string;
  onToggleFilters: () => void;
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
  filtersOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName, onToggleFilters, onToggleBookmarks, onOpenInfo,
  onToggleDirection, onToggleTheme, onExportJson, onExportPng,
  onLoadFile, theme, direction, bookmarkCount, searchQuery, onSearchChange, filtersOpen,
}) => {
  const [exportOpen, setExportOpen] = React.useState(false);

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

      {/* Center */}
      <div className="flex-1 flex justify-center px-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search URLs, titles…"
          className="w-full max-w-xs rounded px-3 py-1.5 text-[11px] outline-none transition-all focus:max-w-sm"
          style={{
            background: 'var(--bg-panel-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          aria-label="Search"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <ToolbarBtn onClick={onToggleFilters} active={filtersOpen} label="Filters">⊟</ToolbarBtn>
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
