import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

interface CrawlEdgeData {
  sourceTag?: string;
  sourceText?: string;
  isCircular?: boolean;
}

const CrawlEdgeComponent: React.FC<EdgeProps<CrawlEdgeData>> = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const isCircular = data?.isCircular;
  const tag = data?.sourceTag || '';

  let strokeDasharray: string | undefined;
  let strokeWidth = 1;

  if (isCircular) {
    strokeWidth = 1.5;
  } else if (tag === 'a') {
    strokeWidth = 1.5;
  } else if (tag === 'link') {
    strokeDasharray = '6 3';
  } else if (tag === 'script' || tag === 'img') {
    strokeDasharray = '2 4';
  }

  const color = isCircular ? 'var(--color-accent-error)' : selected ? 'var(--color-edge-hover)' : 'var(--color-edge)';

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        className="react-flow__edge-path"
        style={{ transition: 'stroke 120ms' }}
      />
      {isCircular && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 9,
              fontFamily: "'Space Mono', monospace",
              padding: '1px 4px',
              borderRadius: 2,
              background: 'var(--bg-panel-secondary)',
              color: 'var(--color-accent-error)',
              border: '1px solid var(--color-accent-error)',
              pointerEvents: 'none',
            }}
          >
            ⟳ Circular
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const CrawlEdge = memo(CrawlEdgeComponent);
