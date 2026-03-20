import React, { useState, useCallback, useEffect } from 'react';
import { CrawlRecord, NodeDiff } from '@/types/crawl';
import { getContentTypeLabel } from '@/lib/contentTypeUtils';

interface NodeSidePanelProps {
  record: CrawlRecord | null;
  diff: NodeDiff | undefined;
  isBookmarked: boolean;
  isHighlighted?: boolean;
  onClose: () => void;
  onUpdateDiff: (url: string, diff: NodeDiff) => void;
  onToggleBookmark: (url: string) => void;
  onRevertNode: (url: string) => void;
  onNavigateToNode: (url: string) => void;
}

export const NodeSidePanel: React.FC<NodeSidePanelProps> = ({
  record, diff, isBookmarked, isHighlighted, onClose, onUpdateDiff, onToggleBookmark, onRevertNode, onNavigateToNode,
}) => {
  const [tab, setTab] = useState<'meta' | 'data' | 'json'>('meta');
  const isOpen = record !== null;

  if (!record) return null;

  const url = record.url;

  return (
    <div
      className="absolute right-0 top-0 h-full overflow-y-auto transition-transform duration-250 z-40"
      style={{
        width: 380,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--color-border)',
        transform: isOpen ? 'translateX(0)' : 'translateX(380px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-[10px] font-bold" style={{ color: isHighlighted ? '#22c55e' : 'var(--color-text-primary)' }}>{url}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-secondary)' }}
            aria-label="Copy URL"
          >
            Copy
          </button>
          <button onClick={onClose} className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }} aria-label="Close">×</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
        {(['meta', 'data', 'json'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[10px] font-bold tracking-wider uppercase"
            style={{
              color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderBottom: tab === t ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === 'meta' ? (
          <MetaTab
            record={record}
            diff={diff}
            isBookmarked={isBookmarked}
            onUpdateDiff={onUpdateDiff}
            onToggleBookmark={onToggleBookmark}
            onNavigateToNode={onNavigateToNode}
          />
        ) : tab === 'data' ? (
          <DataTab record={record} diff={diff} onUpdateDiff={onUpdateDiff} onRevertNode={onRevertNode} />
        ) : (
          <JsonTab record={record} />
        )}
      </div>
    </div>
  );
};

// Meta Tab
const MetaTab: React.FC<{
  record: CrawlRecord;
  diff?: NodeDiff;
  isBookmarked: boolean;
  onUpdateDiff: (url: string, diff: NodeDiff) => void;
  onToggleBookmark: (url: string) => void;
  onNavigateToNode: (url: string) => void;
}> = ({ record, diff, isBookmarked, onUpdateDiff, onToggleBookmark, onNavigateToNode }) => {
  const [nickname, setNickname] = useState(diff?.nickname || '');
  const [description, setDescription] = useState(diff?.description || '');
  const [comments, setComments] = useState(diff?.comments || '');

  useEffect(() => {
    setNickname(diff?.nickname || '');
    setDescription(diff?.description || '');
    setComments(diff?.comments || '');
  }, [record.url, diff]);

  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const debouncedUpdate = useCallback((field: string, value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdateDiff(record.url, { [field]: value });
    }, 300);
  }, [record.url, onUpdateDiff]);

  return (
    <div className="space-y-3">
      <Field label="Nickname">
        <input
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); debouncedUpdate('nickname', e.target.value); }}
          placeholder="Add a custom name…"
          className="w-full rounded px-2 py-1.5 text-[11px] outline-none"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); debouncedUpdate('description', e.target.value); }}
          placeholder="Describe what this page is about…"
          rows={3}
          className="w-full rounded px-2 py-1.5 text-[11px] outline-none resize-none"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        />
      </Field>
      <Field label="Comments">
        <textarea
          value={comments}
          onChange={(e) => { setComments(e.target.value); debouncedUpdate('comments', e.target.value); }}
          placeholder="Internal notes, audit comments…"
          rows={4}
          className="w-full rounded px-2 py-1.5 text-[11px] outline-none resize-none"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        />
      </Field>
      <button
        onClick={() => onToggleBookmark(record.url)}
        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors"
        style={{
          background: isBookmarked ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-panel-secondary)',
          color: isBookmarked ? '#f5c518' : 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
      </button>

      <div className="flex flex-wrap gap-1.5 pt-2">
        <Chip label="Depth" value={String(record.depth)} />
        <Chip label="Type" value={getContentTypeLabel(record.content_type)} />
        <Chip label="Outbound" value={String(record.outbound_links)} />
      </div>
      {record.discovered_on && (
        <button
          onClick={() => onNavigateToNode(record.discovered_on!)}
          className="text-[10px] underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Discovered on: {record.discovered_on.slice(0, 50)}…
        </button>
      )}
    </div>
  );
};

// Data Tab
const DataTab: React.FC<{
  record: CrawlRecord;
  diff?: NodeDiff;
  onUpdateDiff: (url: string, diff: NodeDiff) => void;
  onRevertNode: (url: string) => void;
}> = ({ record, diff, onUpdateDiff, onRevertNode }) => {
  const editableFields = [
    { key: 'page_title', label: 'page_title', value: record.page_title, type: 'text' },
    { key: 'status_code', label: 'status_code', value: record.status_code, type: 'number' },
    { key: 'outbound_links', label: 'outbound_links', value: record.outbound_links, type: 'number' },
    { key: 'error', label: 'error', value: record.error, type: 'text' },
    { key: 'source.text', label: 'source.text', value: record.source.text, type: 'text' },
    { key: 'source.parent_class', label: 'source.parent_class', value: record.source.parent_class, type: 'text' },
    { key: 'source.parent_id', label: 'source.parent_id', value: record.source.parent_id, type: 'text' },
  ];

  const lockedFields = [
    { label: 'url', value: record.url },
    { label: 'depth', value: record.depth },
    { label: 'content_type', value: record.content_type },
    { label: 'discovered_on', value: record.discovered_on },
    { label: 'url_chain', value: JSON.stringify(record.url_chain) },
  ];

  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>EDITABLE FIELDS</p>
      {editableFields.map(f => {
        const edited = diff?.edits?.[f.key as keyof typeof diff.edits];
        const currentValue = edited !== undefined ? String(edited) : (f.value !== null ? String(f.value) : '');
        return (
          <div key={f.key} className="relative">
            <label className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {f.label} {edited !== undefined && <span className="text-[8px]" style={{ color: 'var(--color-border-bright)' }}>(edited)</span>}
            </label>
            <input
              defaultValue={currentValue}
              onChange={(e) => {
                if (timerRef.current) clearTimeout(timerRef.current);
                const val = e.target.value;
                timerRef.current = setTimeout(() => {
                  onUpdateDiff(record.url, {
                    edits: { ...diff?.edits, [f.key]: f.type === 'number' ? Number(val) : (val || null) },
                  });
                }, 300);
              }}
              className="w-full rounded px-2 py-1 text-[10px] outline-none"
              style={{
                background: 'var(--bg-panel-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderLeft: edited !== undefined ? '2px solid var(--color-border-bright)' : undefined,
              }}
            />
          </div>
        );
      })}

      <p className="text-[9px] font-bold tracking-wider mt-4 mb-2" style={{ color: 'var(--color-text-secondary)' }}>READ-ONLY FIELDS 🔒</p>
      {lockedFields.map(f => (
        <div key={f.label}>
          <label className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {f.label}
          </label>
          <div
            className="rounded px-2 py-1 text-[10px] break-all"
            style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            {String(f.value ?? 'null')}
          </div>
        </div>
      ))}

      {diff && (
        <button
          onClick={() => { if (confirm('Revert all edits for this node?')) onRevertNode(record.url); }}
          className="mt-4 rounded px-3 py-1.5 text-[10px] font-bold"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-accent-error)', border: '1px solid var(--color-accent-error)' }}
        >
          Revert Node
        </button>
      )}
    </div>
  );
};

// JSON Tab
const JsonTab: React.FC<{ record: CrawlRecord }> = ({ record }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>RAW JSON</p>
      <button
        onClick={() => navigator.clipboard.writeText(JSON.stringify(record, null, 2))}
        className="text-[9px] px-1.5 py-0.5 rounded"
        style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
      >
        Copy
      </button>
    </div>
    <pre
      className="rounded p-2 text-[9px] overflow-auto whitespace-pre-wrap break-all"
      style={{
        background: 'var(--bg-panel-secondary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        maxHeight: 'calc(100vh - 160px)',
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {JSON.stringify(record, null, 2)}
    </pre>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[9px] font-bold block mb-1 tracking-wider uppercase" style={{ color: 'var(--color-text-secondary)' }}>
      {label}
    </label>
    {children}
  </div>
);

const Chip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span
    className="rounded px-2 py-0.5 text-[9px]"
    style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
  >
    {label}: {value}
  </span>
);
