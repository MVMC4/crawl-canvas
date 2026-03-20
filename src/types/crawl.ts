export interface CrawlRecord {
  url: string;
  depth: number;
  status_code: number | null;
  content_type: string | null;
  discovered_on: string | null;
  url_chain: string[];
  source: {
    tag: string;
    attribute: string;
    text: string;
    parent_tag: string;
    parent_id: string | null;
    parent_class: string;
    context_snippet: string;
  };
  page_title: string | null;
  outbound_links: number;
  error: string | null;
}

export interface NodeDiff {
  nickname?: string;
  description?: string;
  comments?: string;
  edits?: Partial<Pick<CrawlRecord, 'page_title' | 'status_code' | 'outbound_links' | 'error'> & {
    'source.text'?: string;
    'source.parent_class'?: string;
    'source.parent_id'?: string | null;
  }>;
}

export interface StickyNoteData {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  connectedNodeUrl: string | null;
}

export interface ProjectMeta {
  name: string;
  description: string;
  auditNotes: string;
  crawlDate: string;
}

export interface EdgeOverride {
  style?: 'solid' | 'dashed' | 'dotted';
  note?: string;
  hidden?: boolean;
}

export interface FilterState {
  statusCodes: string[];
  contentTypes: string[];
  depthMin: number;
  depthMax: number;
  bookmarkedOnly: boolean;
  hasStickyNote: boolean;
  hasBeenEdited: boolean;
  hasErrors: boolean;
}

export interface ExportRecord extends CrawlRecord {
  __meta?: {
    nickname?: string;
    description?: string;
    comments?: string;
    bookmarked?: boolean;
    edits?: Record<string, unknown>;
  };
}

export interface ExportData {
  __projectMeta: ProjectMeta & {
    exportedAt: string;
    totalRecords: number;
  };
  records: ExportRecord[];
}

export type ThemeMode = 'dark' | 'light';
