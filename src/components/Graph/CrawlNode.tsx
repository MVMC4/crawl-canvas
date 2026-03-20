import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CrawlNodeData } from '@/lib/buildTree';

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

function getNodeColor(statusCode: number | null): string {
  if (statusCode === null) return 'var(--color-node-error-text)';
  if (statusCode >= 500) return 'var(--color-accent-error)';
  if (statusCode === 404) return 'var(--color-node-404-border)';
  if (statusCode >= 300 && statusCode < 400) return 'var(--color-border-bright)';
  return 'var(--color-text-primary)';
}

function getNodeRadius(data: CrawlNodeData): number {
  if (data.record.url === '__VIRTUAL_ROOT__') return 7;
  if (data.record.depth === 0) return 6;
  return 3 + Math.min(data.childCount * 0.4, 4);
}

const CrawlNodeComponent: React.FC<NodeProps<CrawlNodeData> & ExtraProps> = (props) => {
  const { data, selected } = props;
  const extra = (props as unknown as { data: CrawlNodeData & ExtraProps }).data as CrawlNodeData & ExtraProps;
  const { record } = data;
  const label = getNodeLabel(data, extra.nickname);
  const color = getNodeColor(record.status_code);
  const r = getNodeRadius(data);
  const diameter = r * 2;
  const isVirtualRoot = record.url === '__VIRTUAL_ROOT__';

  return (
    <div
      className={`relative group ${extra.isPulsing ? 'animate-node-pulse' : ''}`}
      style={{
        opacity: extra.isFiltered ? 0.08 : 1,
        width: diameter,
        height: diameter,
      }}
    >
      {/* Handles pinned to exact center of dot */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 1, height: 1, top: r, left: r, transform: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 1, height: 1, top: r, left: r, transform: 'none' }}
      />

      {/* The dot */}
      <div
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          background: selected ? 'var(--color-text-primary)' : color,
          border: extra.hasEdits ? `1.5px solid var(--color-border-bright)` : `1px solid ${color}`,
          boxShadow: selected
            ? `0 0 10px ${color}, 0 0 20px ${color}`
            : `0 0 ${r + 2}px ${color}44`,
          transition: 'box-shadow 200ms, background 200ms',
          cursor: 'pointer',
        }}
      />

      {/* Bookmark star */}
      {extra.isBookmarked && (
        <span
          className="absolute text-[7px] pointer-events-none"
          style={{ color: '#f5c518', top: -6, right: -6 }}
        >★</span>
      )}

      {/* Collapsed badge */}
      {data.isCollapsed && data.hiddenDescendants > 0 && (
        <div
          className="absolute rounded-full px-1 pointer-events-none"
          style={{
            top: -5,
            left: diameter,
            fontSize: 7,
            fontFamily: "'Space Mono', monospace",
            background: 'var(--bg-panel-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            lineHeight: '12px',
          }}
        >
          +{data.hiddenDescendants}
        </div>
      )}

      {/* Label on hover or when selected/seed */}
      <div
        className={`absolute whitespace-nowrap pointer-events-none ${
          selected || record.depth === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity duration-150`}
        style={{
          top: diameter + 3,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 8,
          fontFamily: "'Space Mono', monospace",
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          textAlign: 'center',
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {isVirtualRoot ? 'ROOT' : label}
        {record.depth === 0 && !isVirtualRoot && (
          <span style={{ marginLeft: 3, fontSize: 6, letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>SEED</span>
        )}
      </div>
    </div>
  );
};

export const CrawlNode = memo(CrawlNodeComponent);
