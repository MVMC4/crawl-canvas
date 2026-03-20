import React from 'react';
import { FilterState } from '@/types/crawl';

interface FilterSidebarProps {
  open: boolean;
  filters: FilterState;
  onUpdate: (partial: Partial<FilterState>) => void;
  onClear: () => void;
  maxDepthInData: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ open, filters, onUpdate, onClear, maxDepthInData }) => {
  if (!open) return null;

  const statusOptions = ['2xx', '3xx', '404', '5xx', 'error', 'null'];
  const contentOptions = ['html', 'pdf', 'xlsx', 'image', 'script', 'unknown'];

  return (
    <div
      className="fixed left-0 top-[72px] h-[calc(100%-72px)] overflow-y-auto z-30 transition-theme"
      style={{
        width: 240,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="p-3 space-y-4">
        <p className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>FILTERS</p>

        {/* Status Code */}
        <Section label="Status Code">
          <div className="flex flex-wrap gap-1">
            {statusOptions.map(s => (
              <FilterChip
                key={s}
                label={s}
                active={filters.statusCodes.includes(s)}
                onClick={() => {
                  const next = filters.statusCodes.includes(s)
                    ? filters.statusCodes.filter(x => x !== s)
                    : [...filters.statusCodes, s];
                  onUpdate({ statusCodes: next });
                }}
              />
            ))}
          </div>
        </Section>

        {/* Content Type */}
        <Section label="Content Type">
          <div className="flex flex-wrap gap-1">
            {contentOptions.map(c => (
              <FilterChip
                key={c}
                label={c}
                active={filters.contentTypes.includes(c)}
                onClick={() => {
                  const next = filters.contentTypes.includes(c)
                    ? filters.contentTypes.filter(x => x !== c)
                    : [...filters.contentTypes, c];
                  onUpdate({ contentTypes: next });
                }}
              />
            ))}
          </div>
        </Section>

        {/* Depth */}
        <Section label={`Depth ${filters.depthMin} – ${filters.depthMax}`}>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min={0}
              max={maxDepthInData}
              value={filters.depthMin}
              onChange={(e) => onUpdate({ depthMin: Number(e.target.value) })}
              className="flex-1"
            />
            <input
              type="range"
              min={0}
              max={maxDepthInData}
              value={Math.min(filters.depthMax, maxDepthInData)}
              onChange={(e) => onUpdate({ depthMax: Number(e.target.value) })}
              className="flex-1"
            />
          </div>
        </Section>

        {/* Toggles */}
        <Toggle label="Bookmarked only" checked={filters.bookmarkedOnly} onChange={(v) => onUpdate({ bookmarkedOnly: v })} />
        <Toggle label="Has sticky note" checked={filters.hasStickyNote} onChange={(v) => onUpdate({ hasStickyNote: v })} />
        <Toggle label="Has been edited" checked={filters.hasBeenEdited} onChange={(v) => onUpdate({ hasBeenEdited: v })} />
        <Toggle label="Has errors" checked={filters.hasErrors} onChange={(v) => onUpdate({ hasErrors: v })} />

        <button
          onClick={onClear}
          className="w-full rounded py-1.5 text-[10px] font-bold"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-[9px] font-bold tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{label.toUpperCase()}</p>
    {children}
  </div>
);

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="rounded px-2 py-0.5 text-[9px] font-bold transition-colors"
    style={{
      background: active ? 'var(--color-text-primary)' : 'var(--bg-panel-secondary)',
      color: active ? 'var(--bg-canvas)' : 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    }}
  >
    {label}
  </button>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <div
      className="relative w-8 h-4 rounded-full transition-colors"
      style={{ background: checked ? 'var(--color-text-primary)' : 'var(--color-border)' }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute top-0.5 h-3 w-3 rounded-full transition-transform"
        style={{
          background: checked ? 'var(--bg-canvas)' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(16px)' : 'translateX(2px)',
        }}
      />
    </div>
  </label>
);
