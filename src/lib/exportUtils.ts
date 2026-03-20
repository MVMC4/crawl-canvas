import { CrawlRecord, NodeDiff, ProjectMeta, ExportData, ExportRecord } from '@/types/crawl';

export function buildExportData(
  records: CrawlRecord[],
  diffs: Record<string, NodeDiff>,
  bookmarks: string[],
  projectMeta: ProjectMeta
): ExportData {
  const bookmarkSet = new Set(bookmarks);

  const exportRecords: ExportRecord[] = records.map(r => {
    const diff = diffs[r.url];
    const isBookmarked = bookmarkSet.has(r.url);
    const hasMeta = diff || isBookmarked;

    const record: ExportRecord = { ...r };

    if (hasMeta) {
      const meta: ExportRecord['__meta'] = {};
      if (diff?.nickname) meta.nickname = diff.nickname;
      if (diff?.description) meta.description = diff.description;
      if (diff?.comments) meta.comments = diff.comments;
      if (isBookmarked) meta.bookmarked = true;
      if (diff?.edits && Object.keys(diff.edits).length > 0) {
        meta.edits = diff.edits as Record<string, unknown>;
      }
      if (Object.keys(meta).length > 0) {
        record.__meta = meta;
      }
    }

    // Apply edits to the record
    if (diff?.edits) {
      const e = diff.edits;
      if (e.page_title !== undefined) record.page_title = e.page_title;
      if (e.status_code !== undefined) record.status_code = e.status_code;
      if (e.outbound_links !== undefined) record.outbound_links = e.outbound_links;
      if (e.error !== undefined) record.error = e.error;
      if (e['source.text'] !== undefined) record.source = { ...record.source, text: e['source.text'] };
      if (e['source.parent_class'] !== undefined) record.source = { ...record.source, parent_class: e['source.parent_class'] };
      if (e['source.parent_id'] !== undefined) record.source = { ...record.source, parent_id: e['source.parent_id'] ?? null };
    }

    return record;
  });

  return {
    __projectMeta: {
      ...projectMeta,
      exportedAt: new Date().toISOString(),
      totalRecords: records.length,
    },
    records: exportRecords,
  };
}

export function downloadJson(data: ExportData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edited_export.json';
  a.click();
  URL.revokeObjectURL(url);
}
