import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CrawlNodeData } from '@/lib/buildTree';
import { isAssetType } from '@/lib/contentTypeUtils';
import { getContentTypeBadge } from '@/lib/contentTypeUtils';

interface ExtraProps {
  isBookmarked?: boolean;
  hasStickyNote?: boolean;
  hasEdits?: boolean;
  nickname?: string;
  isFiltered?: boolean;
  isPulsing?: boolean;
  onToggleCollapse?: (url: string) => void;
}

function getNodeLabel(data: CrawlNodeData, nickname?: string): string {
  if (nickname) return nickname;
  if (data.record.page_title) return data.record.page_title;
  if (data.record.url === '__VIRTUAL_ROOT__') return 'ROOT';
  try {
    const u = new URL(data.record.url);
    const path = u.pathname === '/' ? u.hostname : u.pathname;
    return path.length > 28 ? path.slice(0, 28) + '…' : path;
  } catch {
    return data.record.url.slice(0, 28);
  }
}

function getNodeStyle(statusCode: number | null, error: string | null, contentType: string | null) {
  const isAsset = isAssetType(contentType);

  let bg = 'var(--bg-node)';
  let border = '1px solid var(--color-border)';
  let textColor = 'var(--color-text-on-node)';
  let shadow = 'none';
  let opacity = 1;

  if (statusCode === null) {
    bg = 'var(--color-node-error-bg)';
    textColor = 'var(--color-node-error-text)';
  } else if (statusCode >= 300 && statusCode < 400) {
    opacity = 0.7;
    border = '1px dashed var(--color-border-bright)';
  } else if (statusCode === 404) {
    bg = 'transparent';
    border = '1.5px dashed var(--color-node-404-border)';
    textColor = 'var(--color-text-secondary)';
  } else if (statusCode >= 500) {
    bg = 'transparent';
    border = '1.5px solid var(--color-accent-error)';
    textColor = 'var(--color-accent-error)';
    shadow = '0 0 6px rgba(204, 34, 34, 0.3)';
  }

  if (isAsset && statusCode !== null && statusCode < 300) {
    bg = 'var(--bg-node-asset)';
  }

  return { bg, border, textColor, shadow, opacity };
}

const CrawlNodeComponent: React.FC<NodeProps<CrawlNodeData> & ExtraProps> = (props) => {
  const { data, selected } = props;
  const extra = (props as unknown as { data: CrawlNodeData & ExtraProps }).data as CrawlNodeData & ExtraProps;
  const { record } = data;
  const isAsset = isAssetType(record.content_type);
  const style = getNodeStyle(record.status_code, record.error, record.content_type);
  const badge = getContentTypeBadge(record.content_type);
  const label = getNodeLabel(data, extra.nickname);
  const chainMismatch = record.url_chain.length !== record.depth + 1 && record.url !== '__VIRTUAL_ROOT__';

  const isVirtualRoot = record.url === '__VIRTUAL_ROOT__';

  return (
    <div
      className={`relative transition-theme ${extra.isPulsing ? 'animate-node-pulse' : ''}`}
      style={{
        opacity: extra.isFiltered ? 0.1 : style.opacity,
        width: isAsset ? 62 : 180,
        height: isAsset ? 62 : 56,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 6, height: 6 }} />

      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        style={{
          background: style.bg,
          border: style.border,
          color: style.textColor,
          boxShadow: selected ? `0 0 0 2px var(--color-text-primary)` : style.shadow,
          borderRadius: isAsset ? 0 : 6,
          transform: isAsset ? 'rotate(45deg)' : undefined,
          transition: 'box-shadow 120ms',
          borderLeft: extra.hasEdits && !isAsset ? '2px solid var(--color-border-bright)' : undefined,
        }}
      >
        <div
          className="flex flex-col items-center gap-0.5 px-2"
          style={{ transform: isAsset ? 'rotate(-45deg)' : undefined }}
        >
          <span className="text-[10px] leading-tight font-bold truncate max-w-[160px]">
            {isVirtualRoot ? 'ROOT' : label}
          </span>
          {!isAsset && !isVirtualRoot && (
            <span className="text-[9px] opacity-70 tabular-nums">
              {record.status_code ?? 'ERR'}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      {!isVirtualRoot && (
        <>
          <span className="absolute -top-1 -left-1 text-[11px]">{badge}</span>
          {extra.isBookmarked && <span className="absolute -top-1 -right-1 text-[11px]" style={{ color: '#f5c518' }}>★</span>}
          {chainMismatch && <span className="absolute top-0 -right-1 text-[11px]" title="URL chain length mismatch">⚠️</span>}
          {extra.hasStickyNote && <span className="absolute -bottom-1 -right-1 text-[10px]">📌</span>}
        </>
      )}

      {record.depth === 0 && !isVirtualRoot && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
          SEED
        </div>
      )}

      {record.error && !isVirtualRoot && (
        <div className="absolute -bottom-4 left-0 right-0 text-center text-[8px] truncate" style={{ color: 'var(--color-accent-error)' }}>
          {record.error}
        </div>
      )}

      {data.isCollapsed && data.hiddenDescendants > 0 && (
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          +{data.hiddenDescendants}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 6, height: 6 }} />
    </div>
  );
};

export const CrawlNode = memo(CrawlNodeComponent);
