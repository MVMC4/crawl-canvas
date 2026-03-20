import { useMemo } from 'react';
import { CrawlRecord } from '@/types/crawl';
import { CycleInfo } from '@/lib/detectCycles';
import { buildNodesAndEdges } from '@/lib/buildTree';

export function useTreeLayout(
  records: CrawlRecord[],
  cycles: CycleInfo[],
  maxDepth: number,
  collapsedNodes: Set<string>,
  direction: 'TB' | 'LR'
) {
  return useMemo(() => {
    if (records.length === 0) return { nodes: [], edges: [] };
    return buildNodesAndEdges(records, cycles, maxDepth, collapsedNodes, direction);
  }, [records, cycles, maxDepth, collapsedNodes, direction]);
}
