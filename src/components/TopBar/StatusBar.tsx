import React from 'react';

interface StatusBarProps {
  total: number;
  showing: number;
  warnings: number;
  savedRecently: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ total, showing, warnings, savedRecently }) => (
  <div
    className="flex h-6 items-center justify-between px-3 text-[10px] transition-theme"
    style={{
      background: 'var(--bg-panel-secondary)',
      color: 'var(--color-text-secondary)',
      borderBottom: '1px solid var(--color-border)',
    }}
  >
    <span>{total} nodes total</span>
    <span>Showing {showing} of {total}{warnings > 0 ? ` · ${warnings} warning${warnings > 1 ? 's' : ''}` : ''}</span>
    <span className={`transition-opacity duration-500 ${savedRecently ? 'opacity-100' : 'opacity-0'}`}>
      Session saved ✓
    </span>
  </div>
);
