export function getContentTypeLabel(ct: string | null): string {
  if (!ct) return 'Unknown';
  if (ct.includes('text/html')) return 'HTML';
  if (ct.includes('application/pdf')) return 'PDF';
  if (ct.includes('spreadsheetml')) return 'XLSX';
  if (ct.includes('javascript')) return 'JS';
  if (ct.includes('text/css')) return 'CSS';
  if (ct.includes('image/')) return 'Image';
  return 'Unknown';
}

export function getContentTypeBadge(ct: string | null): string {
  if (!ct) return '❓';
  if (ct.includes('text/html')) return '🌐';
  if (ct.includes('application/pdf')) return '📄';
  if (ct.includes('spreadsheetml')) return '📊';
  if (ct.includes('image/')) return '🖼';
  if (ct.includes('javascript') || ct.includes('text/css')) return '⚙️';
  return '❓';
}

export function isAssetType(ct: string | null): boolean {
  if (!ct) return false;
  return (
    ct.includes('application/pdf') ||
    ct.includes('spreadsheetml') ||
    ct.includes('image/') ||
    ct.includes('javascript') ||
    ct.includes('text/css')
  );
}

export function isHtmlType(ct: string | null): boolean {
  return ct !== null && ct.includes('text/html');
}
