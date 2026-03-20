import React from 'react';
import { FilterState } from '@/types/crawl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterSidebarProps {
  open: boolean;
  onToggle: () => void;
  filters: FilterState;
  onUpdate: (partial: Partial<FilterState>) => void;
  onClear: () => void;
  maxDepthInData: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ open, onToggle, filters, onUpdate, onClear, maxDepthInData }) => {
  const statusOptions = ['2xx', '3xx', '404', '5xx', 'error', 'null'];
  const contentOptions = ['html', 'pdf', 'xlsx', 'image', 'script', 'unknown'];

  return (
    <>
      {/* Chevron toggle — always visible, top-left of canvas */}
      <button
        onClick={onToggle}
        className="absolute top-3 left-3 z-40 flex items-center justify-center rounded-md transition-colors"
        style={{
          width: 36,
          height: 36,
          background: 'var(--bg-panel)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        aria-label="Toggle filters"
      >
        {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar panel */}
      <div
        className="absolute top-0 left-0 h-full overflow-y-auto z-30 transition-all duration-200"
        style={{
          width: open ? 240 : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="p-3 pt-14 space-y-4" style={{ width: 240 }}>
          <p className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>FILTERS</p>

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
    </>
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
      background: active ? '#22c55e' : 'var(--bg-panel-secondary)',
      color: active ? '#000' : 'var(--color-text-secondary)',
      border: active ? '1px solid #22c55e' : '1px solid var(--color-border)',
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
      style={{ background: checked ? '#22c55e' : 'var(--color-border)' }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute top-0.5 h-3 w-3 rounded-full transition-transform"
        style={{
          background: checked ? '#000' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(16px)' : 'translateX(2px)',
        }}
      />
    </div>
  </label>
);
