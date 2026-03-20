import { useState, useCallback, useEffect } from 'react';
import { CrawlRecord } from '@/types/crawl';
import { detectCycles, CycleInfo } from '@/lib/detectCycles';
import { setSessionRef } from '@/lib/localStorage';

export function useCrawlData() {
  const [records, setRecords] = useState<CrawlRecord[]>([]);
  const [cycles, setCycles] = useState<CycleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Auto-load bundled data on mount
  useEffect(() => {
    fetch('/data/crawl.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load crawl data');
        return res.text();
      })
      .then(text => {
        const worker = new Worker(
          new URL('../workers/parseWorker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (evt) => {
          if (evt.data.type === 'success') {
            const recs = evt.data.records as CrawlRecord[];
            const cyc = detectCycles(recs);
            setRecords(recs);
            setCycles(cyc);
            setSessionRef('crawl.json');
            setLoaded(true);
          } else {
            setError(evt.data.message);
          }
          setLoading(false);
          worker.terminate();
        };

        worker.onerror = (err) => {
          setError(err.message || 'Worker error');
          setLoading(false);
          worker.terminate();
        };

        worker.postMessage(text);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const loadFile = useCallback((file: File) => {
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const worker = new Worker(
        new URL('../workers/parseWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (evt) => {
        if (evt.data.type === 'success') {
          const recs = evt.data.records as CrawlRecord[];
          const cyc = detectCycles(recs);
          setRecords(recs);
          setCycles(cyc);
          setSessionRef(file.name);
          setLoaded(true);
        } else {
          setError(evt.data.message);
        }
        setLoading(false);
        worker.terminate();
      };

      worker.onerror = (err) => {
        setError(err.message || 'Worker error');
        setLoading(false);
        worker.terminate();
      };

      worker.postMessage(text);
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const loadRecords = useCallback((recs: CrawlRecord[]) => {
    const cyc = detectCycles(recs);
    setRecords(recs);
    setCycles(cyc);
    setLoaded(true);
  }, []);

  return { records, cycles, loading, error, loaded, loadFile, loadRecords };
}
