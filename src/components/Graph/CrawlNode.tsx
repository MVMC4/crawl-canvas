import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CrawlNodeData } from '@/lib/buildTree';
import { getContentTypeLabel } from '@/lib/contentTypeUtils';

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

export function getNodeColor(statusCode: number | null, depth?: number): string {
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

function getShapeStyle(
  shape: NodeShape, diameter: number, color: string, selected: boolean,
  hasEdits: boolean, isHighlighted: boolean, isHovered: boolean
): React.CSSProperties {
  const greenColor = '#22c55e';
  const purpleColor = '#a855f7';

  // Determine active highlight: hover or selected "stick"
  const activeHighlight = isHovered || selected;
  let effectColor: string | null = null;
  if (activeHighlight) {
    effectColor = isHighlighted ? purpleColor : greenColor;
  }

  const borderColor = effectColor
    ? effectColor
    : isHighlighted ? greenColor : hasEdits ? 'var(--color-border-bright)' : color;
  const borderWidth = effectColor || isHighlighted ? 2 : hasEdits ? 1.5 : 1;
  const bg = effectColor
    ? effectColor
    : selected ? 'var(--color-text-primary)' : isHighlighted ? greenColor : color;

  const baseShadow = effectColor
    ? `0 0 10px ${effectColor}, 0 0 20px ${effectColor}88`
    : selected
      ? `0 0 10px ${color}, 0 0 20px ${color}`
      : isHighlighted
        ? `0 0 8px ${greenColor}, 0 0 16px ${greenColor}88`
        : `0 0 ${diameter / 2 + 2}px ${color}44`;

  const base: React.CSSProperties = {
    width: diameter,
    height: diameter,
    background: bg,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: baseShadow,
    transition: 'box-shadow 200ms, background 200ms, border 200ms',
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
  const color = getNodeColor(record.status_code, record.depth);
  const r = getNodeRadius(data);
  const diameter = r * 2;
  const isVirtualRoot = record.url === '__VIRTUAL_ROOT__';
  const shape = getNodeShape(record.content_type);
  const isHighlighted = extra.isHighlighted || false;

  let shortPath = '';
  try {
    const u = new URL(record.url);
    shortPath = u.pathname;
  } catch {
    shortPath = record.url;
  }

  const showTooltip = !isVirtualRoot;

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
        style={{ width: diameter, height: diameter }}
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

      {/* Hover tooltip (shows on hover, sticks when selected/clicked) */}
      {showTooltip && (
        <div
          className={`absolute pointer-events-none z-50 transition-opacity duration-150 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{
            top: -4,
            left: diameter + 10,
            minWidth: 170,
            maxWidth: 240,
            background: 'var(--bg-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '5px 7px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <p
            className="text-[8px] font-bold truncate"
            style={{
              color: isHighlighted ? '#22c55e' : 'var(--color-text-primary)',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {record.url}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span className="text-[7px]" style={{ color: 'var(--color-text-secondary)' }}>
              Type: <span style={{ color: 'var(--color-text-primary)' }}>{getContentTypeLabel(record.content_type)}</span>
            </span>
            <span className="text-[7px]" style={{ color: 'var(--color-text-secondary)' }}>
              Depth: <span style={{ color: record.depth === 0 ? '#a855f7' : 'var(--color-text-primary)' }}>{record.depth}</span>
            </span>
          </div>
          <p className="text-[7px] mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
            Path: <span style={{ color: 'var(--color-text-primary)' }}>{shortPath}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export const CrawlNode = memo(CrawlNodeComponent);
