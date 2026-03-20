import { useState, useCallback, useRef, useEffect } from 'react';
import { NodeDiff } from '@/types/crawl';
import { getDiffs, setDiffs } from '@/lib/localStorage';

export function useLocalStorageSync() {
  const [diffs, setDiffsState] = useState<Record<string, NodeDiff>>(() => getDiffs());
  const pendingRef = useRef(diffs);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    pendingRef.current = diffs;
  }, [diffs]);

  const flush = useCallback(() => {
    setDiffs(pendingRef.current);
  }, []);

  const updateDiff = useCallback((url: string, diff: NodeDiff) => {
    setDiffsState(prev => {
      const next = { ...prev, [url]: { ...prev[url], ...diff } };
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDiffs(next), 300);
      return next;
    });
  }, []);

  const removeDiff = useCallback((url: string) => {
    setDiffsState(prev => {
      const next = { ...prev };
      delete next[url];
      pendingRef.current = next;
      setDiffs(next);
      return next;
    });
  }, []);

  return { diffs, updateDiff, removeDiff, flush };
}
