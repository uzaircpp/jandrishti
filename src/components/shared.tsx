// ==========================================
// JanDrishti - small shared presentational bits
// ==========================================
import React from 'react';
import { EMO, type Emotion } from '../data/sample';

export const Panel: React.FC<{ title: string; tag?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }> =
  ({ title, tag, right, children, className = '' }) => (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-default bg-surface-secondary/40">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {tag && <span className="text-[11px] text-text-tertiary">{tag}</span>}
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );

export const LiveTag: React.FC<{ label?: string }> = ({ label = 'Live' }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    {label}
  </span>
);

export const EmotionChip: React.FC<{ emotion: Emotion; small?: boolean }> = ({ emotion, small }) => {
  const e = EMO[emotion];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
      style={{ color: e.color, background: e.soft, border: `1px solid ${e.color}33` }}>
      <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: e.color }} />
      {e.label}
    </span>
  );
};

export const PlatformDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
    <span className="inline-block rounded-sm" style={{ width: 8, height: 8, background: color }} /> {label}
  </span>
);

/** thin horizontal bar used in demographics + coordination signals */
export const Meter: React.FC<{ value: number; color?: string }> = ({ value, color = 'var(--color-gov-blue)' }) => (
  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, value)}%`, background: color }} />
  </div>
);

export const statusStyle = (s: string): { label: string; cls: string } => ({
  rising: { label: 'Rising', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  peaking: { label: 'Peaking', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  steady: { label: 'Steady', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  fading: { label: 'Fading', cls: 'text-gray-600 bg-gray-100 border-gray-200' },
}[s] || { label: s, cls: 'text-gray-600 bg-gray-100 border-gray-200' });
