import React from 'react';
import { Bookmark, Network } from 'lucide-react';

interface BottomDockProps {
  activeView: 'graph' | 'bookmarks';
  onSwitch: (view: 'graph' | 'bookmarks') => void;
  bookmarkCount: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({ activeView, onSwitch, bookmarkCount }) => {
  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-lg px-1 py-1"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      <DockButton
        active={activeView === 'graph'}
        onClick={() => onSwitch('graph')}
        icon={<Network size={14} />}
        label="Graph"
      />
      <DockButton
        active={activeView === 'bookmarks'}
        onClick={() => onSwitch('bookmarks')}
        icon={<Bookmark size={14} />}
        label="Bookmarks"
        badge={bookmarkCount > 0 ? bookmarkCount : undefined}
      />
    </div>
  );
};

const DockButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all duration-150"
    style={{
      background: active ? 'var(--bg-panel-secondary)' : 'transparent',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-border)' : '1px solid transparent',
    }}
  >
    {icon}
    {label}
    {badge !== undefined && (
      <span
        className="ml-0.5 rounded-full px-1 text-[8px]"
        style={{
          background: '#f5c518',
          color: '#000',
          lineHeight: '14px',
          minWidth: 14,
          textAlign: 'center',
        }}
      >
        {badge}
      </span>
    )}
  </button>
);
