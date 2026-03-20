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
  isHighlighted?: boolean;
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

function getNodeColor(statusCode: number | null, depth?: number): string {
  if (depth === 0) return '#a855f7';
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

type NodeShape = 'circle' | 'diamond' | 'square' | 'hexagon';

function getNodeShape(ct: string | null): NodeShape {
  if (!ct) return 'circle';
  if (ct.includes('text/html')) return 'circle';
  if (ct.includes('application/pdf')) return 'diamond';
  if (ct.includes('image/')) return 'hexagon';
  if (ct.includes('javascript') || ct.includes('text/css') || ct.includes('spreadsheetml')) return 'square';
  return 'circle';
}

function getShapeStyle(shape: NodeShape, diameter: number, color: string, selected: boolean, hasEdits: boolean, isHighlighted: boolean): React.CSSProperties {
  const highlightColor = '#22c55e';
  const borderColor = isHighlighted ? highlightColor : hasEdits ? 'var(--color-border-bright)' : color;
  const borderWidth = isHighlighted ? 2 : hasEdits ? 1.5 : 1;
  const bg = selected ? 'var(--color-text-primary)' : isHighlighted ? highlightColor : color;

  const baseShadow = selected
    ? `0 0 10px ${color}, 0 0 20px ${color}`
    : isHighlighted
      ? `0 0 8px ${highlightColor}, 0 0 16px ${highlightColor}88`
      : `0 0 ${diameter / 2 + 2}px ${color}44`;

  const base: React.CSSProperties = {
    width: diameter,
    height: diameter,
    background: bg,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: baseShadow,
    transition: 'box-shadow 200ms, background 200ms',
    cursor: 'pointer',
  };

  switch (shape) {
    case 'circle':
      return { ...base, borderRadius: '50%' };
    case 'diamond':
      return { ...base, borderRadius: 2, transform: 'rotate(45deg)', width: diameter * 0.75, height: diameter * 0.75 };
    case 'square':
      return { ...base, borderRadius: 2 };
    case 'hexagon':
      return { ...base, borderRadius: '50%', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
  }
}

const CrawlNodeComponent: React.FC<NodeProps<CrawlNodeData> & ExtraProps> = (props) => {
  const { data, selected } = props;
  const extra = (props as unknown as { data: CrawlNodeData & ExtraProps }).data as CrawlNodeData & ExtraProps;
  const { record } = data;
  const label = getNodeLabel(data, extra.nickname);
  const color = getNodeColor(record.status_code, record.depth);
  const r = getNodeRadius(data);
  const diameter = r * 2;
  const isVirtualRoot = record.url === '__VIRTUAL_ROOT__';
  const shape = getNodeShape(record.content_type);
  const isHighlighted = extra.isHighlighted || false;

  return (
    <div
      className={`relative group ${extra.isPulsing ? 'animate-node-pulse' : ''}`}
      style={{
        opacity: extra.isFiltered ? 0.08 : 1,
        width: diameter,
        height: diameter,
      }}
    >
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

      {/* The shape */}
      <div
        className="flex items-center justify-center"
        style={{
          width: diameter,
          height: diameter,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={getShapeStyle(shape, diameter, color, !!selected, !!extra.hasEdits, isHighlighted)} />
      </div>

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

      {/* Shape indicator label */}
      {shape !== 'circle' && (
        <div
          className="absolute pointer-events-none text-[6px] font-bold"
          style={{
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--color-text-secondary)',
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.05em',
          }}
        >
          {shape === 'diamond' ? 'PDF' : shape === 'square' ? 'AST' : 'IMG'}
        </div>
      )}

    </div>
  );
};

export const CrawlNode = memo(CrawlNodeComponent);
