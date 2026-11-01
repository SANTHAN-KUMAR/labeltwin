import { lazy, Suspense, useState } from 'react'
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

const NAV: { p: Page; label: string; n?: number; icon?: string }[] = [
  { p: 'sources', label: 'Connect sources', n: 1 },
  { p: 'regwatch', label: 'RegWatch', n: 2 },
  { p: 'change', label: 'Change Copilot', n: 3 },
  { p: 'impact', label: 'Impact engine', n: 4 },
  { p: 'studio', label: 'Compile & trace', n: 5 },
  { p: 'verify', label: 'Verify', n: 6 },
  { p: 'redline', label: 'Semantic redline', n: 7 },
  { p: 'approve', label: 'Risk-routed approval', n: 8 },
  { p: 'release', label: 'Release & line', n: 9 },
  { p: 'audit', label: 'Audit & LBOM', n: 10 },
]

export default function App() {
  const { s, go, set, reset } = useStore()
  const [open, setOpen] = useState(false)
  const P = pages[s.page]
  const v = s.verify ? summarize(s.verify.findings) : null
  const done: Partial<Record<Page, boolean>> = {
    sources: s.resolved.includes('C1'), regwatch: s.regAccepted, change: !!s.change, impact: !!s.change, studio: !!s.compiled,
    verify: !!v && v.fail === 0, redline: s.redlineDone, approve: !!s.lco, release: s.released, audit: s.released,
  }
  const nav = (p: Page) => { go(p); setOpen(false) }
  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Navigation">
        <div className="brand" onClick={() => nav('home')}>
          <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden><rect width="64" height="64" rx="12" fill="#17191d" /><rect x="14" y="16" width="24" height="32" rx="3" fill="none" stroke="#2457d6" strokeWidth="4" /><rect x="26" y="16" width="24" height="32" rx="3" fill="#2457d6" opacity=".85" /><path d="M31 33l5 5 9-11" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div><b>LabelTwin</b><small>Compile · Verify · Prove</small></div>
        </div>
        <button className="btn teal" onClick={() => { set({ tourStep: 0 }); nav('home') }}><Icon name="play" size={14} /> Guided demo</button>
        <div>
          <button className={`navbtn ${s.page === 'home' ? 'on' : ''}`} onClick={() => nav('home')}><span className="num"><Icon name="home" size={12} /></span>Overview</button>
          <div className="navgrp">The flow</div>
          {NAV.map(x => (
            <button key={x.p} className={`navbtn ${s.page === x.p ? 'on' : ''}`} onClick={() => nav(x.p)}>
              <span className={`num ${done[x.p] ? 'done' : ''}`}>{done[x.p] ? '✓' : x.n}</span>{x.label}
            </button>
          ))}
          <div className="navgrp">Evidence</div>
          <button className={`navbtn ${s.page === 'insights' ? 'on' : ''}`} onClick={() => nav('insights')}><span className="num"><Icon name="chart" size={12} /></span>Impact & evidence</button>
          <button className={`navbtn ${s.page === 'validation' ? 'on' : ''}`} onClick={() => nav('validation')}><span className="num"><Icon name="shield" size={12} /></span>Validation lab</button>
          <button className={`navbtn ${s.page === 'architecture' ? 'on' : ''}`} onClick={() => nav('architecture')}><span className="num"><Icon name="layers" size={12} /></span>Architecture</button>
        </div>
        <div className="foot">
          <button className="btn ghost sm" style={{ width: '100%', marginBottom: 10 }} onClick={() => { reset(); setOpen(false) }}>Reset scenario</button>
          Team <b style={{ color: 'var(--ink)' }}>Astute Computer</b> · Teliport S4 · Case Study 4<br />Fictional company, products and identifiers (GS1 demo prefix 952).
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button onClick={() => setOpen(o => !o)} aria-label="Menu"><Icon name="menu" /></button>
          <b onClick={() => nav('home')}>LabelTwin</b>
          <button onClick={() => { set({ tourStep: 0 }); nav('home') }}>▶ Demo</button>
        </div>
        {open && <div className="drawer-bg" style={{ zIndex: 65 }} onClick={() => setOpen(false)} />}
        <main className="content">
          <Suspense fallback={<div className="card">Loading…</div>}><P /></Suspense>
        </main>
      </div>
      <Tour />
    </div>
  )
}
