// ==========================================
// JanDrishti - Sign in
// Split layout: command-center brand panel + credentials form.
// ==========================================
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ShieldCheck, Activity, Share2, Lock, User2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../store/auth.store';

const FEATURES = [
  { icon: Activity, text: 'Multi-dimensional sentiment & sarcasm, live' },
  { icon: Share2, text: 'Influence mapping & coordinated-behaviour detection' },
  { icon: ShieldCheck, text: 'Aggregate, anonymized — privacy by design' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const login = useAuth(s => s.login);
  const [username, setUsername] = useState('analyst');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await login(username, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Sign-in failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-surface-secondary">
      {/* brand / command-center panel */}
      <div className="officer-command-center relative hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white overflow-hidden">
        <div className="officer-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/15"><Radio className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>JanDrishti</h1>
              <p className="text-white/55 text-xs tracking-wide">Audience Intelligence · SIH26152</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">AI Social Media Analytics</p>
          <h2 className="mt-3 text-3xl xl:text-4xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Who is steering the conversation — and where it's heading.
          </h2>
          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            One timeline across platforms: sentiment, demographics, trends and influence — with
            coordinated-behaviour detection so manipulation isn't mistaken for organic sentiment.
          </p>
          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><f.icon className="w-4 h-4" /></span>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-white/35 text-xs">National Technical Research Organisation · Team GIT-PUSH-PRAY</p>
      </div>

      {/* form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gov-blue flex items-center justify-center text-white"><Radio className="w-5 h-5" /></div>
            <div><h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>JanDrishti</h1><p className="text-xs text-text-tertiary">Audience Intelligence</p></div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>Sign in</h2>
          <p className="text-sm text-text-secondary mt-1">Analyst access to the intelligence console.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-text-secondary mb-1.5">Username</label>
              <div className="relative">
                <User2 className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input id="username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
                  className="w-full rounded-lg border border-border-default bg-surface-primary pl-9 pr-3 py-2.5 text-sm text-text-primary outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input id="password" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  className="w-full rounded-lg border border-border-default bg-surface-primary pl-9 pr-10 py-2.5 text-sm text-text-primary outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {err && <p className="text-xs font-medium text-error bg-error-bg border border-rejected-border rounded-md px-3 py-2">{err}</p>}

            <button type="submit" disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gov-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-gov-blue-dark disabled:opacity-50 transition">
              {busy ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-border-default bg-surface-secondary px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Demo credentials</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button onClick={() => { setUsername('analyst'); setPassword('sih2026'); }} className="rounded-md border border-border-default bg-white px-2.5 py-1 font-mono text-text-secondary hover:border-gov-blue">analyst / sih2026</button>
              <button onClick={() => { setUsername('admin'); setPassword('sih2026'); }} className="rounded-md border border-border-default bg-white px-2.5 py-1 font-mono text-text-secondary hover:border-gov-blue">admin / sih2026</button>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-text-tertiary leading-relaxed">
            Prototype authentication. The production build uses the organisation's SSO / OAuth; sessions never leave the device in this demo.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
