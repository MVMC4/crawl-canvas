import { CrawlRecord } from '@/types/crawl';
import { CycleInfo } from './detectCycles';
import { isAssetType } from './contentTypeUtils';
import { Node, Edge } from 'reactflow';
import dagre from '@dagrejs/dagre';

export interface CrawlNodeData {
  record: CrawlRecord;
  childCount: number;
  isCollapsed: boolean;
  hiddenDescendants: number;
}

export function buildNodesAndEdges(
  records: CrawlRecord[],
  cycles: CycleInfo[],
  maxDepth: number,
  collapsedNodes: Set<string>,
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node<CrawlNodeData>[]; edges: Edge[] } {
  const cycleEdgeSet = new Set(cycles.map(c => `${c.sourceUrl}__${c.targetUrl}`));
  const urlToRecord = new Map<string, CrawlRecord>();
  const childrenMap = new Map<string, CrawlRecord[]>();

  for (const r of records) {
    urlToRecord.set(r.url, r);
  }

  for (const r of records) {
    if (r.discovered_on && !cycleEdgeSet.has(`${r.discovered_on}__${r.url}`)) {
      const children = childrenMap.get(r.discovered_on) || [];
      children.push(r);
      childrenMap.set(r.discovered_on, children);
    }
  }

  const roots = records.filter(r => r.depth === 0 || r.discovered_on === null);
  const hasVirtualRoot = roots.length > 1;

  // Count descendants recursively
  const descendantCount = new Map<string, number>();
  function countDescendants(url: string): number {
    if (descendantCount.has(url)) return descendantCount.get(url)!;
    const children = childrenMap.get(url) || [];
    let count = children.length;
    for (const c of children) {
      count += countDescendants(c.url);
    }
    descendantCount.set(url, count);
    return count;
  }
  for (const r of records) countDescendants(r.url);

  // Determine which nodes are visible
  const visibleUrls = new Set<string>();
  function addVisible(url: string, depth: number) {
    const record = urlToRecord.get(url);
    if (!record) return;
    if (record.depth > maxDepth) return;
    visibleUrls.add(url);
    if (collapsedNodes.has(url)) return;
    const children = childrenMap.get(url) || [];
    for (const c of children) {
      addVisible(c.url, depth + 1);
    }
  }

  if (hasVirtualRoot) {
    visibleUrls.add('__VIRTUAL_ROOT__');
    for (const r of roots) addVisible(r.url, 0);
  } else if (roots.length === 1) {
    addVisible(roots[0].url, 0);
  }

  // Build dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 56;
  const assetSize = 62;

  // Add nodes
  const nodes: Node<CrawlNodeData>[] = [];
  const edges: Edge[] = [];

  if (hasVirtualRoot) {
    g.setNode('__VIRTUAL_ROOT__', { width: 100, height: 40 });
    nodes.push({
      id: '__VIRTUAL_ROOT__',
      type: 'crawlNode',
      position: { x: 0, y: 0 },
      data: {
        record: {
          url: '__VIRTUAL_ROOT__',
          depth: -1,
          status_code: 200,
          content_type: 'text/html',
          discovered_on: null,
          url_chain: [],
          source: { tag: '', attribute: '', text: '', parent_tag: '', parent_id: null, parent_class: '', context_snippet: '' },
          page_title: 'ROOT',
          outbound_links: 0,
          error: null,
        },
        childCount: roots.length,
        isCollapsed: false,
        hiddenDescendants: 0,
      },
    });
  }

  for (const url of visibleUrls) {
    if (url === '__VIRTUAL_ROOT__') continue;
    const record = urlToRecord.get(url)!;
    const isAsset = isAssetType(record.content_type);
    const w = isAsset ? assetSize : nodeWidth;
    const h = isAsset ? assetSize : nodeHeight;
    g.setNode(url, { width: w, height: h });

    const isCollapsed = collapsedNodes.has(url);
    const children = childrenMap.get(url) || [];
    let hiddenDesc = 0;
    if (isCollapsed) {
      hiddenDesc = descendantCount.get(url) || 0;
    }

    nodes.push({
      id: url,
      type: 'crawlNode',
      position: { x: 0, y: 0 },
      data: {
        record,
        childCount: children.length,
        isCollapsed,
        hiddenDescendants: hiddenDesc,
      },
    });
  }

  // Add edges
  if (hasVirtualRoot) {
    for (const r of roots) {
      if (visibleUrls.has(r.url)) {
        edges.push({
          id: `__VIRTUAL_ROOT__->${r.url}`,
          source: '__VIRTUAL_ROOT__',
          target: r.url,
          type: 'crawlEdge',
        });
        g.setEdge('__VIRTUAL_ROOT__', r.url);
      }
    }
  }

  for (const r of records) {
    if (!r.discovered_on) continue;
    if (!visibleUrls.has(r.url) || !visibleUrls.has(r.discovered_on)) continue;
    const isCircular = cycleEdgeSet.has(`${r.discovered_on}__${r.url}`);
    if (isCircular) continue; // skip cycle edges from tree layout

    edges.push({
      id: `${r.discovered_on}->${r.url}`,
      source: r.discovered_on,
      target: r.url,
      type: 'crawlEdge',
      data: { sourceTag: r.source.tag, sourceText: r.source.text, isCircular: false },
    });
    g.setEdge(r.discovered_on, r.url);
  }

  // Add cycle edges visually but not to dagre
  for (const c of cycles) {
    if (visibleUrls.has(c.sourceUrl) && visibleUrls.has(c.targetUrl)) {
      edges.push({
        id: `cycle:${c.sourceUrl}->${c.targetUrl}`,
        source: c.sourceUrl,
        target: c.targetUrl,
        type: 'crawlEdge',
        data: { sourceTag: 'a', sourceText: '', isCircular: true },
        animated: true,
      });
    }
  }

  // Run dagre layout
  dagre.layout(g);

  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - (dagreNode.width || 0) / 2,
        y: dagreNode.y - (dagreNode.height || 0) / 2,
      };
    }
  }

  return { nodes, edges };
}
