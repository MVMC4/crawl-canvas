import { CrawlRecord } from '@/types/crawl';
import { CycleInfo } from './detectCycles';
import { Node, Edge } from 'reactflow';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

export interface CrawlNodeData {
  record: CrawlRecord;
  childCount: number;
  isCollapsed: boolean;
  hiddenDescendants: number;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  record: CrawlRecord;
  childCount: number;
  isCollapsed: boolean;
  hiddenDescendants: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  sourceTag: string;
  sourceText: string;
  isCircular: boolean;
}

export function buildNodesAndEdges(
  records: CrawlRecord[],
  cycles: CycleInfo[],
  maxDepth: number,
  collapsedNodes: Set<string>,
  _direction: 'TB' | 'LR' = 'TB'
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

  // Count descendants
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

  // Determine visible nodes
  const visibleUrls = new Set<string>();
  function addVisible(url: string) {
    const record = urlToRecord.get(url);
    if (!record) return;
    if (record.depth > maxDepth) return;
    visibleUrls.add(url);
    if (collapsedNodes.has(url)) return;
    const children = childrenMap.get(url) || [];
    for (const c of children) {
      addVisible(c.url);
    }
  }

  if (hasVirtualRoot) {
    visibleUrls.add('__VIRTUAL_ROOT__');
    for (const r of roots) addVisible(r.url);
  } else if (roots.length === 1) {
    addVisible(roots[0].url);
  }

  // Build simulation nodes
  const simNodes: SimNode[] = [];
  const simLinks: SimLink[] = [];

  if (hasVirtualRoot) {
    simNodes.push({
      id: '__VIRTUAL_ROOT__',
      record: {
        url: '__VIRTUAL_ROOT__', depth: -1, status_code: 200, content_type: 'text/html',
        discovered_on: null, url_chain: [],
        source: { tag: '', attribute: '', text: '', parent_tag: '', parent_id: null, parent_class: '', context_snippet: '' },
        page_title: 'ROOT', outbound_links: 0, error: null,
      },
      childCount: roots.length,
      isCollapsed: false,
      hiddenDescendants: 0,
    });
  }

  for (const url of visibleUrls) {
    if (url === '__VIRTUAL_ROOT__') continue;
    const record = urlToRecord.get(url)!;
    const isCollapsed = collapsedNodes.has(url);
    const children = childrenMap.get(url) || [];
    simNodes.push({
      id: url,
      record,
      childCount: children.length,
      isCollapsed,
      hiddenDescendants: isCollapsed ? (descendantCount.get(url) || 0) : 0,
    });
  }

  // Build links
  if (hasVirtualRoot) {
    for (const r of roots) {
      if (visibleUrls.has(r.url)) {
        simLinks.push({
          id: `__VIRTUAL_ROOT__->${r.url}`,
          source: '__VIRTUAL_ROOT__',
          target: r.url,
          sourceTag: '',
          sourceText: '',
          isCircular: false,
        });
      }
    }
  }

  for (const r of records) {
    if (!r.discovered_on) continue;
    if (!visibleUrls.has(r.url) || !visibleUrls.has(r.discovered_on)) continue;
    const isCircular = cycleEdgeSet.has(`${r.discovered_on}__${r.url}`);
    if (isCircular) continue;
    simLinks.push({
      id: `${r.discovered_on}->${r.url}`,
      source: r.discovered_on,
      target: r.url,
      sourceTag: r.source.tag,
      sourceText: r.source.text,
      isCircular: false,
    });
  }

  // Add cycle edges (visual only)
  const cycleEdges: Edge[] = [];
  for (const c of cycles) {
    if (visibleUrls.has(c.sourceUrl) && visibleUrls.has(c.targetUrl)) {
      cycleEdges.push({
        id: `cycle:${c.sourceUrl}->${c.targetUrl}`,
        source: c.sourceUrl,
        target: c.targetUrl,
        type: 'crawlEdge',
        data: { sourceTag: 'a', sourceText: '', isCircular: true },
        animated: true,
      });
    }
  }

  // Create node index map for d3-force
  const nodeById = new Map(simNodes.map((n, i) => [n.id, i]));
  const d3Links = simLinks
    .filter(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as SimNode).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as SimNode).id;
      return nodeById.has(sId) && nodeById.has(tId);
    })
    .map(l => ({
      source: typeof l.source === 'string' ? l.source : (l.source as SimNode).id,
      target: typeof l.target === 'string' ? l.target : (l.target as SimNode).id,
    }));

  // Run force simulation
  const nodeCount = simNodes.length;
  const chargeStrength = nodeCount > 500 ? -30 : nodeCount > 100 ? -60 : -120;
  const linkDistance = nodeCount > 500 ? 40 : nodeCount > 100 ? 60 : 80;

  const simulation = forceSimulation(simNodes)
    .force('link', forceLink<SimNode, SimulationLinkDatum<SimNode>>(d3Links).id(d => d.id).distance(linkDistance).strength(0.4))
    .force('charge', forceManyBody().strength(chargeStrength))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<SimNode>(16))
    .stop();

  // Tick to convergence
  const ticks = Math.min(300, Math.max(100, Math.ceil(nodeCount * 0.5)));
  for (let i = 0; i < ticks; i++) simulation.tick();

  // Convert to React Flow nodes and edges
  const nodes: Node<CrawlNodeData>[] = simNodes.map(sn => ({
    id: sn.id,
    type: 'crawlNode',
    position: { x: sn.x || 0, y: sn.y || 0 },
    data: {
      record: sn.record,
      childCount: sn.childCount,
      isCollapsed: sn.isCollapsed,
      hiddenDescendants: sn.hiddenDescendants,
    },
  }));

  const edges: Edge[] = simLinks.map(sl => {
    const sId = typeof sl.source === 'string' ? sl.source : (sl.source as SimNode).id;
    const tId = typeof sl.target === 'string' ? sl.target : (sl.target as SimNode).id;
    return {
      id: sl.id,
      source: sId,
      target: tId,
      type: 'crawlEdge',
      data: { sourceTag: sl.sourceTag, sourceText: sl.sourceText, isCircular: sl.isCircular },
    };
  });

  return { nodes, edges: [...edges, ...cycleEdges] };
}
