import React, { memo } from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer } from 'reactflow';

interface CrawlEdgeData {
  sourceTag?: string;
  sourceText?: string;
  isCircular?: boolean;
  isAsset?: boolean;
}

const CrawlEdgeComponent: React.FC<EdgeProps<CrawlEdgeData>> = ({
  id, sourceX, sourceY, targetX, targetY, data, selected,
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const isCircular = data?.isCircular;
  const isAsset = data?.isAsset;

  const color = isCircular
    ? 'var(--color-accent-error)'
    : selected
      ? 'var(--color-edge-hover)'
      : 'var(--color-edge)';

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isCircular ? 1 : 0.5}
        strokeOpacity={isCircular ? 0.8 : 0.25}
        className="react-flow__edge-path"
        style={{ transition: 'stroke 150ms, stroke-opacity 150ms' }}
      />
      {isCircular && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 8,
              fontFamily: "'Space Mono', monospace",
              padding: '1px 3px',
              borderRadius: 2,
              background: 'var(--bg-panel-secondary)',
              color: 'var(--color-accent-error)',
              border: '1px solid var(--color-accent-error)',
              pointerEvents: 'none',
            }}
          >
            ⟳
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const CrawlEdge = memo(CrawlEdgeComponent);
