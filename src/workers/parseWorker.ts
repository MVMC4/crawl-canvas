// Web Worker for JSON parsing
self.onmessage = function (e: MessageEvent) {
  try {
    const text = e.data as string;
    const parsed = JSON.parse(text);

    let records: unknown[];
    if (Array.isArray(parsed)) {
      records = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
      records = parsed.records;
    } else {
      throw new Error('JSON must be an array of crawl records or an object with a "records" array');
    }

    if (records.length === 0) {
      throw new Error('The file appears to be empty or contains no crawl records');
    }

    self.postMessage({ type: 'success', records, count: records.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    self.postMessage({ type: 'error', message });
  }
};
