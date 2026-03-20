import { useState, useMemo, useCallback } from 'react';
import { CrawlRecord, FilterState } from '@/types/crawl';
import { getFilters, setFilters } from '@/lib/localStorage';

const defaultFilters: FilterState = {
  statusCodes: [],
  contentTypes: [],
  depthMin: 0,
  depthMax: 999,
  bookmarkedOnly: false,
  hasStickyNote: false,
  hasBeenEdited: false,
  hasErrors: false,
};

export function useFilters(
  records: CrawlRecord[],
  bookmarks: Set<string>,
  editedUrls: Set<string>,
  noteUrls: Set<string>
) {
  const [filters, setFiltersState] = useState<FilterState>(() => getFilters() || defaultFilters);

  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...partial };
      setFilters(next);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.statusCodes.length > 0 ||
      filters.contentTypes.length > 0 ||
      filters.depthMin > 0 ||
      filters.depthMax < 999 ||
      filters.bookmarkedOnly ||
      filters.hasStickyNote ||
      filters.hasBeenEdited ||
      filters.hasErrors
    );
  }, [filters]);

  const matchingUrls = useMemo(() => {
    if (!hasActiveFilters) return null; // null = show all

    const matching = new Set<string>();
    for (const r of records) {
      let pass = true;

      if (filters.statusCodes.length > 0) {
        const bucket = getStatusBucket(r.status_code, r.error);
        if (!filters.statusCodes.includes(bucket)) pass = false;
      }
      if (pass && filters.contentTypes.length > 0) {
        const ct = getContentBucket(r.content_type);
        if (!filters.contentTypes.includes(ct)) pass = false;
      }
      if (pass && (r.depth < filters.depthMin || r.depth > filters.depthMax)) pass = false;
      if (pass && filters.bookmarkedOnly && !bookmarks.has(r.url)) pass = false;
      if (pass && filters.hasStickyNote && !noteUrls.has(r.url)) pass = false;
      if (pass && filters.hasBeenEdited && !editedUrls.has(r.url)) pass = false;
      if (pass && filters.hasErrors && r.error === null) pass = false;

      if (pass) matching.add(r.url);
    }
    return matching;
  }, [records, filters, hasActiveFilters, bookmarks, editedUrls, noteUrls]);

  return { filters, updateFilters, clearFilters, matchingUrls, hasActiveFilters };
}

function getStatusBucket(code: number | null, error: string | null): string {
  if (code === null) return error ? 'error' : 'null';
  if (code >= 200 && code < 300) return '2xx';
  if (code >= 300 && code < 400) return '3xx';
  if (code === 404) return '404';
  if (code >= 500) return '5xx';
  return 'other';
}

function getContentBucket(ct: string | null): string {
  if (!ct) return 'unknown';
  if (ct.includes('text/html')) return 'html';
  if (ct.includes('application/pdf')) return 'pdf';
  if (ct.includes('spreadsheetml')) return 'xlsx';
  if (ct.includes('image/')) return 'image';
  if (ct.includes('javascript') || ct.includes('text/css')) return 'script';
  return 'unknown';
}
