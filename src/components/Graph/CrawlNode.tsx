import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CrawlNodeData } from '@/lib/buildTree';
import { isAssetType, getContentTypeBadge } from '@/lib/contentTypeUtils';

interface ExtraProps {
  isBookmarked?: boolean;
  hasStickyNote?: boolean;
  hasEdits?: boolean;
  nickname?: string;
  isFiltered?: boolean;
  isPulsing?: boolean;
}

function getNodeLabel(data: CrawlNodeData, nickname?: string): string {
  if (nickname) return nickname;
  if (data.record.page_title) return data.record.page_title;
  if (data.record.url === '__VIRTUAL_ROOT__') return 'ROOT';
  try {
    const u = new URL(data.record.url);
    const path = u.pathname === '/' ? u.hostname : u.pathname;
    return path.length > 20 ? path.slice(0, 20) + '…' : path;
  } catch {
    return data.record.url.slice(0, 20);
  }
}

function getNodeColor(statusCode: number | null, error: string | null): string {
  if (statusCode === null) return 'var(--color-node-error-text)';
  if (statusCode >= 500) return 'var(--color-accent-error)';
  if (statusCode === 404) return 'var(--color-node-404-border)';
  if (statusCode >= 300 && statusCode < 400) return 'var(--color-border-bright)';
  return 'var(--color-text-primary)';
}

function getNodeSize(data: CrawlNodeData): number {
  // Seed nodes are larger, nodes with more children are slightly larger
  if (data.record.url === '__VIRTUAL_ROOT__') return 14;
  if (data.record.depth === 0) return 12;
  const base = 6;
  const extra = Math.min(data.childCount * 0.5, 6);
  return base + extra;
}

const CrawlNodeComponent: React.FC<NodeProps<CrawlNodeData> & ExtraProps> = (props) => {
  const { data, selected } = props;
  const extra = (props as unknown as { data: CrawlNodeData & ExtraProps }).data as CrawlNodeData & ExtraProps;
  const { record } = data;
  const label = getNodeLabel(data, extra.nickname);
  const color = getNodeColor(record.status_code, record.error);
  const size = getNodeSize(data);
  const isVirtualRoot = record.url === '__VIRTUAL_ROOT__';

  const handleStyle = { opacity: 0, width: 1, height: 1 };

  return (
    <div
      className={`relative group ${extra.isPulsing ? 'animate-node-pulse' : ''}`}
      style={{
        opacity: extra.isFiltered ? 0.08 : 1,
        width: size * 2 + 40,
        height: size * 2 + 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />

      {/* The dot */}
      <div
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: '50%',
          background: selected ? 'var(--color-text-primary)' : color,
          border: selected ? '2px solid var(--color-text-primary)' : extra.hasEdits ? `2px solid var(--color-border-bright)` : `1.5px solid ${color}`,
          boxShadow: selected
            ? `0 0 12px ${color}, 0 0 24px ${color}`
            : `0 0 ${size}px ${color}33`,
          transition: 'box-shadow 200ms, background 200ms, transform 150ms',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Bookmark indicator */}
        {extra.isBookmarked && (
          <span
            className="absolute -top-1 -right-1 text-[8px]"
            style={{ color: '#f5c518' }}
          >
            ★
          </span>
        )}
        {extra.hasStickyNote && (
          <span className="absolute -bottom-1 -right-1 text-[7px]">📌</span>
        )}
      </div>

      {/* Label — visible on hover or when selected */}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none absolute whitespace-nowrap"
        style={{
          top: size * 2 + 4,
          fontSize: 9,
          fontFamily: "'Space Mono', monospace",
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          opacity: selected ? 1 : undefined,
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
        {record.status_code !== null && record.status_code !== 200 && !isVirtualRoot && (
          <span style={{ marginLeft: 3, color: color, fontSize: 8 }}>{record.status_code}</span>
        )}
      </div>

      {/* Always-visible label for selected or seed */}
      {(selected || record.depth === 0) && !isVirtualRoot && (
        <div
          className="pointer-events-none absolute whitespace-nowrap"
          style={{
            top: size * 2 + 4,
            fontSize: 9,
            fontFamily: "'Space Mono', monospace",
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
          {record.depth === 0 && (
            <span style={{ marginLeft: 4, fontSize: 7, letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>SEED</span>
          )}
        </div>
      )}

      {/* Collapsed badge */}
      {data.isCollapsed && data.hiddenDescendants > 0 && (
        <div
          className="absolute rounded-full px-1 py-0.5"
          style={{
            top: -4,
            left: size * 2,
            fontSize: 7,
            fontFamily: "'Space Mono', monospace",
            background: 'var(--bg-panel-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          +{data.hiddenDescendants}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
};

export const CrawlNode = memo(CrawlNodeComponent);
