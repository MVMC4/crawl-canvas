import { CrawlRecord } from '@/types/crawl';

export interface CycleInfo {
  sourceUrl: string;
  targetUrl: string;
}

export function detectCycles(records: CrawlRecord[]): CycleInfo[] {
  const cycles: CycleInfo[] = [];
  const urlToDiscoveredOn = new Map<string, string | null>();

  for (const r of records) {
    urlToDiscoveredOn.set(r.url, r.discovered_on);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  for (const r of records) {
    if (visited.has(r.url)) continue;
    const stack: string[] = [];
    let current: string | null = r.url;

    while (current && !visited.has(current)) {
      if (inStack.has(current)) {
        // Found cycle - the edge from discovered_on -> current is the back-edge
        const parent = urlToDiscoveredOn.get(current);
        if (parent) {
          cycles.push({ sourceUrl: parent, targetUrl: current });
        }
        break;
      }
      inStack.add(current);
      stack.push(current);
      current = urlToDiscoveredOn.get(current) ?? null;
    }

    for (const s of stack) {
      visited.add(s);
      inStack.delete(s);
    }
  }

  return cycles;
}
