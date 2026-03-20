import { useState, useCallback } from 'react';
import { StickyNoteData } from '@/types/crawl';
import { getStickyNotes, setStickyNotes } from '@/lib/localStorage';

export function useStickyNotes() {
  const [notes, setNotes] = useState<StickyNoteData[]>(() => getStickyNotes());

  const save = (n: StickyNoteData[]) => { setNotes(n); setStickyNotes(n); };

  const addNote = useCallback((x: number, y: number) => {
    const note: StickyNoteData = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      x, y,
      width: 200,
      height: 160,
      pinned: true,
      connectedNodeUrl: null,
    };
    setNotes(prev => { const n = [...prev, note]; setStickyNotes(n); return n; });
    return note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<StickyNoteData>) => {
    setNotes(prev => {
      const n = prev.map(note => note.id === id ? { ...note, ...updates } : note);
      setStickyNotes(n);
      return n;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => { const n = prev.filter(note => note.id !== id); setStickyNotes(n); return n; });
  }, []);

  return { notes, addNote, updateNote, deleteNote };
}
