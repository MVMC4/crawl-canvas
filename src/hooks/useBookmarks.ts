import { useState, useCallback } from 'react';
import { getBookmarks, setBookmarks as saveBookmarks } from '@/lib/localStorage';

export function useBookmarks() {
  const [bookmarks, setBookmarksState] = useState<Set<string>>(() => new Set(getBookmarks()));

  const toggle = useCallback((url: string) => {
    setBookmarksState(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      saveBookmarks(Array.from(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback((url: string) => bookmarks.has(url), [bookmarks]);

  return { bookmarks, toggle, isBookmarked, count: bookmarks.size, list: Array.from(bookmarks) };
}
