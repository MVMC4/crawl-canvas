import { NodeDiff, StickyNoteData, ProjectMeta, EdgeOverride, FilterState } from '@/types/crawl';

const KEYS = {
  diff: 'crawlgraph_diff',
  stickynotes: 'crawlgraph_stickynotes',
  bookmarks: 'crawlgraph_bookmarks',
  projectmeta: 'crawlgraph_projectmeta',
  edgeoverrides: 'crawlgraph_edgeoverrides',
  filters: 'crawlgraph_filters',
  theme: 'crawlgraph_theme',
  rawdata: 'crawlgraph_rawdata_ref',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

// Diffs
export function getDiffs(): Record<string, NodeDiff> {
  return safeGet(KEYS.diff, {});
}
export function setDiffs(diffs: Record<string, NodeDiff>) {
  safeSet(KEYS.diff, diffs);
}

// Sticky notes
export function getStickyNotes(): StickyNoteData[] {
  return safeGet(KEYS.stickynotes, []);
}
export function setStickyNotes(notes: StickyNoteData[]) {
  safeSet(KEYS.stickynotes, notes);
}

// Bookmarks
export function getBookmarks(): string[] {
  return safeGet(KEYS.bookmarks, []);
}
export function setBookmarks(bookmarks: string[]) {
  safeSet(KEYS.bookmarks, bookmarks);
}

// Project meta
export function getProjectMeta(): ProjectMeta | null {
  return safeGet(KEYS.projectmeta, null);
}
export function setProjectMeta(meta: ProjectMeta) {
  safeSet(KEYS.projectmeta, meta);
}

// Edge overrides
export function getEdgeOverrides(): Record<string, EdgeOverride> {
  return safeGet(KEYS.edgeoverrides, {});
}
export function setEdgeOverrides(overrides: Record<string, EdgeOverride>) {
  safeSet(KEYS.edgeoverrides, overrides);
}

// Filters
export function getFilters(): FilterState | null {
  return safeGet(KEYS.filters, null);
}
export function setFilters(filters: FilterState) {
  safeSet(KEYS.filters, filters);
}

// Theme
export function getTheme(): 'dark' | 'light' {
  return safeGet(KEYS.theme, 'dark');
}
export function setThemeStorage(theme: 'dark' | 'light') {
  safeSet(KEYS.theme, theme);
}

// Has session
export function hasSession(): boolean {
  return localStorage.getItem(KEYS.rawdata) !== null;
}
export function setSessionRef(fileName: string) {
  safeSet(KEYS.rawdata, fileName);
}
export function getSessionRef(): string | null {
  return safeGet(KEYS.rawdata, null);
}

// Clear all
export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
