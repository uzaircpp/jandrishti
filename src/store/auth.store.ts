// ==========================================
// JanDrishti - auth session (prototype)
// Persists the session in localStorage and gates the app behind /login.
// ==========================================
import { create } from 'zustand';

export interface User { username: string; name: string; role: string; }
interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const KEY = 'jd_auth';
function load(): { token: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { token: null, user: null };
}

export const useAuth = create<AuthState>((set) => ({
  ...load(),
  login: async (username, password) => {
    const DEMO: Record<string, { pw: string; name: string; role: string }> = {
      analyst: { pw: 'sih2026', name: 'Analyst', role: 'Analyst · Desk-2' },
      admin: { pw: 'sih2026', name: 'Supervisor', role: 'Supervisor · SOC' },
    };
    const uname = username.trim().toLowerCase();
    try {
      const r = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password }),
      });
      if (r.ok) {
        const data = await r.json();
        try { localStorage.setItem(KEY, JSON.stringify({ token: data.token, user: data.user })); } catch { /* ignore */ }
        set({ token: data.token, user: data.user });
        return;
      }
      if (r.status === 401) throw new Error('Invalid username or password');
      throw new Error('network'); // 5xx etc. -> try offline fallback below
    } catch (e) {
      if (e instanceof Error && e.message === 'Invalid username or password') throw e;
      // backend unreachable - allow the demo credentials offline
      const d = DEMO[uname];
      if (d && d.pw === password) {
        const user = { username: uname, name: d.name, role: d.role };
        try { localStorage.setItem(KEY, JSON.stringify({ token: 'offline-demo', user })); } catch { /* ignore */ }
        set({ token: 'offline-demo', user });
        return;
      }
      throw new Error('Invalid username or password');
    }
  },
  logout: () => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    set({ token: null, user: null });
  },
}));
