import { lazy, Suspense, useRef, useState } from 'react'
import { useStore, type Page } from './state/store'
import { Tour } from './components/Tour'
import { Icon } from './components/ui'
import { summarize } from './engine/verify'
import Home from './pages/Home'

const pages: Record<Page, React.LazyExoticComponent<() => React.JSX.Element> | (() => React.JSX.Element)> = {
  home: Home,
  sources: lazy(() => import('./pages/Sources')),
  regwatch: lazy(() => import('./pages/RegWatch')),
  change: lazy(() => import('./pages/Change')),
  impact: lazy(() => import('./pages/Impact')),
  studio: lazy(() => import('./pages/Studio')),
  verify: lazy(() => import('./pages/Verify')),
  redline: lazy(() => import('./pages/Redline')),
  approve: lazy(() => import('./pages/Approve')),
  release: lazy(() => import('./pages/Release')),
  audit: lazy(() => import('./pages/Audit')),
  insights: lazy(() => import('./pages/Insights')),
  validation: lazy(() => import('./pages/Validation')),
  architecture: lazy(() => import('./pages/Architecture')),
}

const STEPS: { p: Page; label: string; n: number }[] = [
  { p: 'sources', label: 'Connect', n: 1 },
  { p: 'regwatch', label: 'RegWatch', n: 2 },
  { p: 'change', label: 'Change', n: 3 },
  { p: 'impact', label: 'Impact', n: 4 },
  { p: 'studio', label: 'Compile', n: 5 },
  { p: 'verify', label: 'Verify', n: 6 },
  { p: 'redline', label: 'Redline', n: 7 },
  { p: 'approve', label: 'Approve', n: 8 },
  { p: 'release', label: 'Release', n: 9 },
  { p: 'audit', label: 'Audit', n: 10 },
]
const FLOW_ORDER: Page[] = ['home', ...STEPS.map(s => s.p), 'insights', 'validation', 'architecture']
const EVIDENCE: { p: Page; label: string; icon: string }[] = [
  { p: 'insights', label: 'Impact & evidence', icon: 'chart' },
  { p: 'validation', label: 'Validation lab', icon: 'shield' },
  { p: 'architecture', label: 'Architecture', icon: 'layers' },
]

export default function App() {
  const { s, go, set, reset } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const P = pages[s.page]
  const v = s.verify ? summarize(s.verify.findings) : null
  const done: Partial<Record<Page, boolean>> = {
    sources: s.resolved.includes('C1'), regwatch: s.regAccepted, change: !!s.change, impact: !!s.change, studio: !!s.compiled,
    verify: !!v && v.fail === 0, redline: s.redlineDone, approve: !!s.lco, release: s.released, audit: s.released,
  }
  const dirRef = useRef<'fwd' | 'back'>('fwd')
  const prevIdx = useRef(0)
  const curIdx = FLOW_ORDER.indexOf(s.page)
  dirRef.current = curIdx >= prevIdx.current ? 'fwd' : 'back'
  prevIdx.current = curIdx

  const nav = (p: Page) => { go(p); setMenuOpen(false) }

  return (
    <div className="app">
      <header className="topbar-main">
        <button className="brand-h" onClick={() => nav('home')}>
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden><rect width="64" height="64" rx="12" fill="#14161a" /><rect x="14" y="16" width="24" height="32" rx="3" fill="none" stroke="#3457d9" strokeWidth="4" /><rect x="26" y="16" width="24" height="32" rx="3" fill="#3457d9" opacity=".85" /><path d="M31 33l5 5 9-11" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>LabelTwin</span>
        </button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn teal sm hide-xs" onClick={() => { set({ tourStep: 0 }); nav('home') }}><Icon name="play" size={13} /> Guided demo</button>
          <button className="menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}><Icon name="menu" size={18} /></button>
        </div>
      </header>

      <nav className="stepper-wrap" aria-label="Pipeline steps">
        <div className="stepper">
          <button className={`snode ${s.page === 'home' ? 'on' : ''}`} onClick={() => nav('home')}>
            <span className="dot"><Icon name="home" size={11} /></span>Overview
          </button>
          {STEPS.map((x, i) => (
            <span key={x.p} style={{ display: 'contents' }}>
              <span className={`slink ${done[x.p] ? 'done' : ''}`} />
              <button className={`snode ${s.page === x.p ? 'on' : ''}`} onClick={() => nav(x.p)}>
                <span className={`dot ${done[x.p] ? 'done' : ''}`}>{done[x.p] ? <Icon name="check" size={11} /> : i + 1}</span>{x.label}
              </button>
            </span>
          ))}
        </div>
      </nav>

      {menuOpen && <div className="drawer-bg" onClick={() => setMenuOpen(false)} />}
      <aside className={`navdrawer ${menuOpen ? 'open' : ''}`} aria-label="Full navigation" aria-hidden={!menuOpen}>
        <div className="between" style={{ marginBottom: 6 }}>
          <b style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Menu</b>
          <button className="btn ghost sm" onClick={() => setMenuOpen(false)}><Icon name="x" size={14} /></button>
        </div>
        <button className="btn teal" style={{ width: '100%' }} onClick={() => { set({ tourStep: 0 }); nav('home') }}><Icon name="play" size={14} /> Guided demo</button>
        <div className="navgrp">Overview</div>
        <button className={`navbtn ${s.page === 'home' ? 'on' : ''}`} onClick={() => nav('home')}><span className="num"><Icon name="home" size={12} /></span>Overview</button>
        <div className="navgrp">The flow</div>
        {STEPS.map(x => (
          <button key={x.p} className={`navbtn ${s.page === x.p ? 'on' : ''}`} onClick={() => nav(x.p)}>
            <span className={`num ${done[x.p] ? 'done' : ''}`}>{done[x.p] ? '✓' : x.n}</span>{x.label}
          </button>
        ))}
        <div className="navgrp">Evidence</div>
        {EVIDENCE.map(x => (
          <button key={x.p} className={`navbtn ${s.page === x.p ? 'on' : ''}`} onClick={() => nav(x.p)}>
            <span className="num"><Icon name={x.icon} size={12} /></span>{x.label}
          </button>
        ))}
        <div className="sep" />
        <button className="btn ghost sm" style={{ width: '100%', marginBottom: 10 }} onClick={() => { reset(); setMenuOpen(false) }}>Reset scenario</button>
        <p className="tiny muted" style={{ margin: 0 }}>
          Team <b style={{ color: 'var(--ink)' }}>Astute Computer</b> · Teliport S4 · Case Study 4<br />Fictional company, products and identifiers (GS1 demo prefix 952).
        </p>
      </aside>

      <main className="content">
        <div key={s.page} className={`page-enter page-${dirRef.current}`}>
          <Suspense fallback={<div className="card">Loading…</div>}><P /></Suspense>
        </div>
      </main>
      <Tour />
    </div>
  )
}
