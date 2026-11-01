import type { ReactNode } from 'react'

export const CRITERIA = {
  C1: 'Problem understanding',
  C2: 'Regulatory awareness',
  C3: 'AI label design',
  C4: 'AI / automation platform',
  C5: 'End-to-end coverage',
  C6: 'Accuracy & validation',
  C7: 'Traceability & audit',
} as const
export type Crit = keyof typeof CRITERIA

export function PageHeader({ eyebrow, title, desc, crit, steps, right }: { eyebrow: string; title: string; desc: ReactNode; crit: Crit[]; steps?: string; right?: ReactNode }) {
  return (
    <div className="ph">
      <div style={{ minWidth: 0, flex: '1 1 520px' }}>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
        <div className="chips" style={{ marginTop: 10 }}>
          {crit.map(c => <span key={c} className={`chip ${c === 'C7' ? 'c7' : c === 'C6' ? 'c6' : c === 'C2' ? 'c2' : ''}`}>✓ {CRITERIA[c]}</span>)}
          {steps && <span className="chip" style={{ background: '#eef1f4', color: '#4b5a6a' }}>Process steps {steps}</span>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function Sev({ s }: { s: 'pass' | 'fail' | 'warn' }) {
  return <span className={`badge b-${s}`}>{s === 'pass' ? '✓ PASS' : s === 'fail' ? '✕ FAIL' : '! WARN'}</span>
}

export function Stat({ v, l, tone }: { v: ReactNode; l: ReactNode; tone?: string }) {
  return <div className="stat"><span className="v" style={tone ? { color: tone } : undefined}>{v}</span><span className="l">{l}</span></div>
}

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    play: <path d="M7 5l12 7-12 7z" fill="currentColor" />,
    check: <path d="M5 12l5 5 9-11" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    db: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
    radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12l6-6" /></>,
    spark: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
    graph: <><circle cx="5" cy="12" r="2.5" /><circle cx="19" cy="5" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M7.3 11l9.3-4.8M7.3 13l9.3 4.8" /></>,
    label: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h10" /></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    pen: <path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" />,
    truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    chain: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />,
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
    home: <path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>,
    camera: <><path d="M4 7h4l2-3h4l2 3h4v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
    download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p[name]}</svg>
}

export function download(name: string, data: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
