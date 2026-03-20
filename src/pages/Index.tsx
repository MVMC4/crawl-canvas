import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TopBar } from '@/components/TopBar/TopBar';
import { StatusBar } from '@/components/TopBar/StatusBar';
import { CrawlGraph } from '@/components/Graph/CrawlGraph';
import { NodeSidePanel } from '@/components/SidePanel/NodeSidePanel';
import { FilterSidebar } from '@/components/FilterSidebar/FilterSidebar';
import { BookmarksPanel } from '@/components/BookmarksPanel/BookmarksPanel';
import { ProjectMetaModal } from '@/components/ProjectMetaModal/ProjectMetaModal';
import { BottomDock } from '@/components/BottomDock/BottomDock';
import { useCrawlData } from '@/hooks/useCrawlData';
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useFilters } from '@/hooks/useFilters';
import { useTheme } from '@/hooks/useTheme';
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { ProjectMeta } from '@/types/crawl';
import { getProjectMeta, setProjectMeta as saveProjectMeta, clearAll } from '@/lib/localStorage';
import { buildExportData, downloadJson } from '@/lib/exportUtils';

const Index: React.FC = () => {
  const { records, cycles, loading, error, loaded, loadFile } = useCrawlData();
  const { diffs, updateDiff, removeDiff } = useLocalStorageSync();
  const { bookmarks, toggle: toggleBookmark, isBookmarked, count: bookmarkCount, list: bookmarkList } = useBookmarks();
  const { notes, addNote } = useStickyNotes();
  const { theme, toggle: toggleTheme } = useTheme();

  const editedUrls = useMemo(() => new Set(Object.keys(diffs)), [diffs]);
  const noteUrls = useMemo(() => new Set(notes.filter(n => n.connectedNodeUrl).map(n => n.connectedNodeUrl!)), [notes]);

  const { filters, updateFilters, clearFilters, matchingUrls, hasActiveFilters } = useFilters(records, bookmarks, editedUrls, noteUrls);

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
  const [maxDepth, setMaxDepth] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [pulsingNode, setPulsingNode] = useState<string | null>(null);
  const [flyToNode, setFlyToNode] = useState<string | null>(null);
  const [savedRecently, setSavedRecently] = useState(false);
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>(() => getProjectMeta() || { name: '', description: '', auditNotes: '', crawlDate: '' });
  const [activeView, setActiveView] = useState<'graph' | 'bookmarks'>('graph');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRecord = useMemo(() => records.find(r => r.url === selectedUrl) || null, [records, selectedUrl]);

  const maxDepthInData = useMemo(() => Math.max(0, ...records.map(r => r.depth)), [records]);
  const deeperCount = useMemo(() => records.filter(r => r.depth > maxDepth).length, [records, maxDepth]);

  const showingCount = useMemo(() => {
    if (!matchingUrls) return records.filter(r => r.depth <= maxDepth).length;
    return records.filter(r => r.depth <= maxDepth && matchingUrls.has(r.url)).length;
  }, [records, maxDepth, matchingUrls]);

  const searchMatchingUrls = useMemo(() => {
    if (!searchQuery.trim()) return matchingUrls;
    const q = searchQuery.toLowerCase();
    const searchMatches = new Set<string>();
    for (const r of records) {
      const nick = diffs[r.url]?.nickname || '';
      const desc = diffs[r.url]?.description || '';
      if (
        r.url.toLowerCase().includes(q) ||
        (r.page_title?.toLowerCase().includes(q)) ||
        nick.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      ) {
        searchMatches.add(r.url);
      }
    }
    if (matchingUrls) {
      return new Set([...searchMatches].filter(u => matchingUrls.has(u)));
    }
    return searchMatches;
  }, [searchQuery, records, diffs, matchingUrls]);

  const highlightedUrls = useMemo(() => {
    const set = new Set<string>();
    if (searchQuery.trim() && searchMatchingUrls) {
      for (const u of searchMatchingUrls) set.add(u);
    }
    if (hasActiveFilters && matchingUrls) {
      for (const u of matchingUrls) set.add(u);
    }
    return set.size > 0 ? set : null;
  }, [searchQuery, searchMatchingUrls, hasActiveFilters, matchingUrls]);

  const navigateToNode = useCallback((url: string) => {
    setActiveView('graph');
    setFlyToNode(url);
    setPulsingNode(url);
    setSelectedUrl(url);
    setTimeout(() => setPulsingNode(null), 2000);
  }, []);

  const handleExportJson = useCallback(() => {
    const data = buildExportData(records, diffs, bookmarkList, projectMeta);
    downloadJson(data);
  }, [records, diffs, bookmarkList, projectMeta]);

  const handleSaveProjectMeta = useCallback((meta: ProjectMeta) => {
    setProjectMeta(meta);
    saveProjectMeta(meta);
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2000);
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Reset all edits, bookmarks, and notes? This cannot be undone.')) {
      clearAll();
      window.location.reload();
    }
  }, []);

  const handleContextAddNote = useCallback((x: number, y: number) => {
    addNote(x, y);
  }, [addNote]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUrl(null);
        setInfoOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setActiveView(v => v === 'bookmarks' ? 'graph' : 'bookmarks');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="rounded-full animate-pulse"
                style={{
                  width: 6 + i * 2,
                  height: 6 + i * 2,
                  background: 'var(--color-border-bright)',
                  animationDelay: `${i * 150}ms`,
                  opacity: 0.3 + i * 0.15,
                }}
              />
            ))}
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
              {error ? 'Error' : 'LOADING CRAWL DATA'}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {error || 'Parsing records and building graph…'}
            </p>
          </div>
          {loading && (
            <div className="w-32 h-0.5 mx-auto rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full animate-pulse"
                style={{ background: 'var(--color-border-bright)', width: '60%' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen transition-theme" style={{ background: 'var(--bg-canvas)' }}>
      <TopBar
        projectName={projectMeta.name}
        onToggleBookmarks={() => setActiveView(v => v === 'bookmarks' ? 'graph' : 'bookmarks')}
        onOpenInfo={() => setInfoOpen(true)}
        onToggleDirection={() => setDirection(d => d === 'TB' ? 'LR' : 'TB')}
        onToggleTheme={toggleTheme}
        onExportJson={handleExportJson}
        onExportPng={() => {}}
        onLoadFile={() => fileInputRef.current?.click()}
        theme={theme}
        direction={direction}
        bookmarkCount={bookmarkCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        records={records}
        diffs={diffs}
        onNavigateToNode={navigateToNode}
      />
      <StatusBar
        total={records.length}
        showing={showingCount}
        warnings={cycles.length}
        savedRecently={savedRecently}
      />

      {deeperCount > 0 && activeView === 'graph' && (
        <div className="flex items-center justify-center py-1" style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setMaxDepth(maxDepthInData)}
            className="text-[10px] font-bold px-3 py-1 rounded"
            style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            ⬇ Load deeper nodes ({deeperCount} remaining)
          </button>
          <button
            onClick={() => setMaxDepth(d => Math.min(d + 1, maxDepthInData))}
            className="ml-2 text-[10px] px-2 py-1 rounded"
            style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            +1 level
          </button>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {/* Graph view */}
        <div className={activeView === 'graph' ? 'h-full w-full' : 'hidden'}>
          <CrawlGraph
            records={records}
            cycles={cycles}
            diffs={diffs}
            bookmarks={bookmarks}
            noteUrls={noteUrls}
            matchingUrls={searchQuery.trim() ? searchMatchingUrls : matchingUrls}
            direction={direction}
            maxDepth={maxDepth}
            onNodeClick={(url) => setSelectedUrl(url)}
            selectedUrl={selectedUrl}
            pulsingNode={pulsingNode}
            flyToNode={flyToNode}
            onFlyToDone={() => setFlyToNode(null)}
            onContextAddNote={handleContextAddNote}
            highlightedUrls={highlightedUrls}
          />
        </div>

        {/* Bookmarks view */}
        <BookmarksPanel
          open={activeView === 'bookmarks'}
          onClose={() => setActiveView('graph')}
          bookmarks={bookmarkList}
          records={records}
          diffs={diffs}
          onSelect={(url) => setSelectedUrl(url)}
          onRemove={toggleBookmark}
        />

        {/* Filter sidebar — only in graph view */}
        {activeView === 'graph' && (
          <FilterSidebar
            open={filtersOpen}
            onToggle={() => setFiltersOpen(p => !p)}
            filters={filters}
            onUpdate={updateFilters}
            onClear={clearFilters}
            maxDepthInData={maxDepthInData}
          />
        )}

        <NodeSidePanel
          record={selectedRecord}
          diff={selectedUrl ? diffs[selectedUrl] : undefined}
          isBookmarked={selectedUrl ? isBookmarked(selectedUrl) : false}
          isHighlighted={selectedUrl && highlightedUrls ? highlightedUrls.has(selectedUrl) : false}
          onClose={() => setSelectedUrl(null)}
          onUpdateDiff={(url, diff) => { updateDiff(url, diff); setSavedRecently(true); setTimeout(() => setSavedRecently(false), 2000); }}
          onToggleBookmark={toggleBookmark}
          onRevertNode={removeDiff}
          onNavigateToNode={navigateToNode}
          onGoToNode={navigateToNode}
        />

        {/* Bottom dock */}
        <BottomDock
          activeView={activeView}
          onSwitch={setActiveView}
          bookmarkCount={bookmarkCount}
        />
      </div>

      <ProjectMetaModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        meta={projectMeta}
        onSave={handleSaveProjectMeta}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (confirm('Loading a new file will replace current data. Continue?')) {
              clearAll();
              loadFile(file);
            }
          }
        }}
      />
    </div>
  );
};

export default Index;
