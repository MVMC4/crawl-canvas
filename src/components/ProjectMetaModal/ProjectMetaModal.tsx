import React, { useState, useEffect } from 'react';
import { ProjectMeta } from '@/types/crawl';

interface ProjectMetaModalProps {
  open: boolean;
  onClose: () => void;
  meta: ProjectMeta;
  onSave: (meta: ProjectMeta) => void;
}

export const ProjectMetaModal: React.FC<ProjectMetaModalProps> = ({ open, onClose, meta, onSave }) => {
  const [form, setForm] = useState(meta);

  useEffect(() => { setForm(meta); }, [meta]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-lg p-5 w-full max-w-md"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-[12px] font-bold tracking-wider mb-4" style={{ color: 'var(--color-text-primary)' }}>PROJECT INFO</h2>
        <div className="space-y-3">
          <Field label="Project Name">
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded px-2 py-1.5 text-[11px] outline-none"
              style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded px-2 py-1.5 text-[11px] outline-none resize-none"
              style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </Field>
          <Field label="Audit Notes">
            <textarea
              value={form.auditNotes}
              onChange={(e) => setForm(f => ({ ...f, auditNotes: e.target.value }))}
              rows={4}
              className="w-full rounded px-2 py-1.5 text-[11px] outline-none resize-none"
              style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </Field>
          <Field label="Crawl Date">
            <input
              type="date"
              value={form.crawlDate}
              onChange={(e) => setForm(f => ({ ...f, crawlDate: e.target.value }))}
              className="w-full rounded px-2 py-1.5 text-[11px] outline-none"
              style={{ background: 'var(--bg-panel-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-[10px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="rounded px-3 py-1.5 text-[10px] font-bold"
            style={{ background: 'var(--color-text-primary)', color: 'var(--bg-canvas)' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[9px] font-bold block mb-1 tracking-wider uppercase" style={{ color: 'var(--color-text-secondary)' }}>
      {label}
    </label>
    {children}
  </div>
);
