import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  ReactFlowInstance,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CrawlNode } from './CrawlNode';
import { CrawlEdge } from './CrawlEdge';
import { CrawlRecord, NodeDiff } from '@/types/crawl';
import { CycleInfo } from '@/lib/detectCycles';
import { useTreeLayout } from '@/hooks/useTreeLayout';
import { CrawlNodeData } from '@/lib/buildTree';
import { isHtmlType } from '@/lib/contentTypeUtils';
import { LocateFixed } from 'lucide-react';

const nodeTypes = { crawlNode: CrawlNode };
const edgeTypes = { crawlEdge: CrawlEdge };

interface CrawlGraphProps {
  records: CrawlRecord[];
  cycles: CycleInfo[];
  diffs: Record<string, NodeDiff>;
  bookmarks: Set<string>;
  noteUrls: Set<string>;
  matchingUrls: Set<string> | null;
  direction: 'TB' | 'LR';
  maxDepth: number;
  onNodeClick: (url: string) => void;
  pulsingNode: string | null;
  flyToNode: string | null;
  onFlyToDone: () => void;
  onContextAddNote?: (x: number, y: number) => void;
  highlightedUrls?: Set<string> | null;
}

export const CrawlGraph: React.FC<CrawlGraphProps> = ({
  records, cycles, diffs, bookmarks, noteUrls, matchingUrls,
  direction, maxDepth, onNodeClick, pulsingNode, flyToNode, onFlyToDone,
  onContextAddNote, highlightedUrls,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const [showReturnBtn, setShowReturnBtn] = useState(false);

  const recordsByUrl = useMemo(() => {
    const m = new Map<string, CrawlRecord>();
    for (const r of records) m.set(r.url, r);
    return m;
  }, [records]);

  const { nodes: layoutNodes, edges: layoutEdges } = useTreeLayout(records, cycles, maxDepth, collapsedNodes, direction);

  const enhancedNodes = useMemo(() => {
    return layoutNodes.map(node => {
      const url = node.id;
      const diff = diffs[url];
      const nd = node.data as CrawlNodeData;
      const isMatch = matchingUrls ? matchingUrls.has(url) : false;
      const isHighlight = highlightedUrls ? highlightedUrls.has(url) : false;
      return {
        ...node,
        data: {
          ...nd,
          nickname: diff?.nickname,
          isBookmarked: bookmarks.has(url),
          hasStickyNote: noteUrls.has(url),
          hasEdits: !!diff,
          isFiltered: matchingUrls ? !matchingUrls.has(url) && url !== '__VIRTUAL_ROOT__' : false,
          isPulsing: pulsingNode === url,
          isHighlighted: isMatch || isHighlight,
        },
      };
    });
  }, [layoutNodes, diffs, bookmarks, noteUrls, matchingUrls, pulsingNode, highlightedUrls]);

  const enhancedEdges = useMemo(() => {
    return layoutEdges.map(edge => {
      const targetRecord = recordsByUrl.get(edge.target);
      const isAsset = targetRecord ? !isHtmlType(targetRecord.content_type) : false;
      return {
        ...edge,
        data: {
          ...edge.data,
          isAsset,
        },
      };
    });
  }, [layoutEdges, recordsByUrl]);

  const [nodes, setNodes, onNodesChange] = useNodesState(enhancedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(enhancedEdges);

  useEffect(() => {
    setNodes(enhancedNodes);
    setEdges(enhancedEdges);
  }, [enhancedNodes, enhancedEdges, setNodes, setEdges]);

  useEffect(() => {
    if (flyToNode && rfRef.current) {
      const node = nodes.find(n => n.id === flyToNode);
      if (node) {
        rfRef.current.setCenter(
          node.position.x + 90,
          node.position.y + 28,
          { zoom: 1.2, duration: 600 }
        );
        onFlyToDone();
      }
    }
  }, [flyToNode, nodes, onFlyToDone]);

  const checkViewport = useCallback(() => {
    if (!rfRef.current || nodes.length === 0) return;
    const vp = rfRef.current.getViewport();
    setShowReturnBtn(vp.zoom < 0.15);
  }, [nodes]);

  const handleReturnToContent = useCallback(() => {
    if (rfRef.current) {
      rfRef.current.fitView({ padding: 0.2, duration: 500 });
      setShowReturnBtn(false);
    }
  }, []);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.id === '__VIRTUAL_ROOT__') return;
    onNodeClick(node.id);
  }, [onNodeClick]);

  const handleNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextAddNote && rfRef.current) {
      const bounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (bounds) {
        const position = rfRef.current.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        onContextAddNote(position.x, position.y);
      }
    }
  }, [onContextAddNote]);

  return (
    <div className="h-full w-full relative" style={{ background: 'var(--bg-canvas)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onInit={(instance) => { rfRef.current = instance; }}
        onPaneContextMenu={handlePaneContextMenu}
        onMoveEnd={checkViewport}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-border)" gap={40} size={0.5} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={1}
          nodeColor={() => 'var(--color-text-primary)'}
          style={{ width: 120, height: 80 }}
          maskColor="rgba(0,0,0,0.85)"
        />
      </ReactFlow>

      {showReturnBtn && (
        <button
          onClick={handleReturnToContent}
          className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          <LocateFixed size={14} />
          Return to content
        </button>
      )}
    </div>
  );
};
