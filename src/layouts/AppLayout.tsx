// ==========================================
// JanDrishti - App shell (sidebar + top bar)
// Mirrors the BhumiSetu government layout: navy sidebar, light top bar.
// ==========================================
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Activity, TrendingUp, Share2, Users2, ShieldAlert,
  Radio, ChevronLeft, Bell, Search, ChevronDown, Menu, MapPin, LogOut, Map, RefreshCw,
} from 'lucide-react';
import { useUIStore } from '../store/ui.store';
import { useData } from '../store/data.store';
import { useAuth } from '../store/auth.store';

const NAV = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/sentiment', label: 'Sentiment', icon: Activity },
  { path: '/narratives', label: 'Narratives & Trends', icon: TrendingUp },
  { path: '/network', label: 'Influence Network', icon: Share2 },
  { path: '/geography', label: 'Geographic View', icon: Map },
  { path: '/demographics', label: 'Demographics', icon: Users2 },
  { path: '/coordination', label: 'Coordination Alerts', icon: ShieldAlert },
];

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { online, corpusSize, generatedAt, loadLive, refreshLive, refreshing,
          watchlist: WATCHLIST, narratives: NARRATIVES,
          selectedTopic, selectedTopicTitle, setTopic } = useData();
  const ago = (iso: string | null) => {
    if (!iso) return '';
    try {
      const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
      if (s < 60) return `${s}s ago`;
      if (s < 3600) return `${Math.round(s / 60)}m ago`;
      if (s < 86400) return `${Math.round(s / 3600)}h ago`;
      return `${Math.round(s / 86400)}d ago`;
    } catch { return ''; }
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const flagged = NARRATIVES.filter(n => n.flagged).length;

  useEffect(() => { loadLive(); }, [loadLive]);
  useEffect(() => { setNotifOpen(false); setProfileOpen(false); }, [location.pathname]);

  return (
    <div className="app-shell flex h-screen bg-transparent">
      {/* Sidebar */}
      <aside className={`gov-gradient flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>JanDrishti</h1>
              <p className="text-white/50 text-[10px] truncate">Audience Intelligence · SIH26152</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) => `sidebar-nav relative ${isActive ? 'text-white' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.div layoutId="nav-active" className="absolute inset-0 bg-white/10 rounded-md -z-10 shadow-[inset_3px_0_0_0_#74cd91]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate relative z-10">{item.label}</span>}
                  {!sidebarCollapsed && item.path === '/coordination' && flagged > 0 &&
                    <span className="relative z-10 ml-auto rounded-full bg-[#c5453a] px-2 text-[11px] font-bold text-white">{flagged}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={toggleSidebarCollapse} className="flex items-center justify-center py-3 border-t border-white/10 text-white/50 hover:text-white transition-colors">
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass-header h-14 border-b border-border-default flex items-center justify-between px-4 flex-shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebarCollapse} className="lg:hidden p-1.5 rounded hover:bg-surface-tertiary"><Menu className="w-5 h-5 text-text-secondary" /></button>
            <div className="hidden md:flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gov-blue-50 text-gov-blue flex-shrink-0"><Radio className="w-4 h-4" /></span>
              <div className="leading-tight min-w-0">
                <div className="text-[13px] font-semibold text-text-primary truncate max-w-[340px]">{selectedTopicTitle || WATCHLIST.name}</div>
                <div className="text-[11px] text-text-tertiary truncate flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{selectedTopicTitle ? 'Focused topic · all views scoped to this news' : `${WATCHLIST.region}${online && generatedAt ? ` · updated ${ago(generatedAt)}` : online ? '' : ' · sample data'}`}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {NARRATIVES.length > 0 && (
              <select value={selectedTopic} onChange={e => setTopic(e.target.value)}
                title="Focus the whole dashboard — sentiment, map, demographics — on one news topic"
                className="hidden sm:block max-w-[230px] rounded-md border border-border-default bg-white/70 px-2.5 py-1.5 text-xs text-text-secondary hover:bg-white focus:outline-none focus:ring-2 focus:ring-gov-blue/20">
                <option value="all">🌐 All trending topics</option>
                {NARRATIVES.map(n => <option key={n.id} value={n.id}>{n.title.length > 58 ? n.title.slice(0, 58) + '…' : n.title}</option>)}
              </select>
            )}
            <button onClick={() => refreshLive()} disabled={refreshing}
              title="Pull fresh live data (trending topics across platforms)"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white disabled:opacity-60 transition">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Pulling…' : 'Go live'}</span>
            </button>
            <button className="p-2 rounded-md hover:bg-surface-tertiary text-text-secondary"><Search className="w-4.5 h-4.5" /></button>
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="p-2 rounded-md hover:bg-surface-tertiary text-text-secondary relative">
                <Bell className="w-4.5 h-4.5" />
                {flagged > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#c5453a] rounded-full" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-lg shadow-dropdown border border-border-default z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-border-default"><h4 className="text-sm font-semibold">Alerts</h4></div>
                  <div className="p-2">
                    {NARRATIVES.filter(n => n.flagged || n.momentum > 100).slice(0, 5).map(n => (
                      <div key={n.id} className="px-3 py-2 rounded hover:bg-surface-secondary">
                        <p className="text-sm font-medium text-text-primary truncate">{n.flagged ? '⚑ Coordination flagged' : '▲ Rising fast'}: {n.title}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{n.posts.toLocaleString('en-IN')} posts · momentum {n.momentum > 0 ? '+' : ''}{n.momentum}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={online
                ? { color: '#2f7d50', background: '#e1f8e7', borderColor: '#a8e9bb' }
                : { color: '#85837a', background: '#ede4cb', borderColor: '#d4c8aa' }}
              title={online ? 'Connected to the FastAPI pipeline' : 'Backend offline — showing bundled sample data'}>
              <span className="relative flex h-2 w-2">
                {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: online ? '#3e9862' : '#a39d8c' }} />
              </span>
              {online ? `Live pipeline · ${corpusSize.toLocaleString('en-IN')} posts` : 'Sample data'}
            </div>
            <div className="relative">
              <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-tertiary">
                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center"><span className="text-xs font-medium text-white">{user?.name?.[0] ?? 'A'}</span></div>
                <ChevronDown className="w-3 h-3 text-text-tertiary hidden sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-dropdown border border-border-default z-50 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-default">
                    <p className="text-sm font-medium text-text-primary">{user?.name ?? 'Analyst'}</p>
                    <p className="text-xs text-text-tertiary">{user?.role ?? 'Analyst desk'}</p>
                  </div>
                  <button onClick={() => { logout(); navigate('/login', { replace: true }); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary transition">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ambient-main flex-1 overflow-y-auto p-6">
          <div className="ambient-shapes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative z-10 max-w-[1400px] mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};
