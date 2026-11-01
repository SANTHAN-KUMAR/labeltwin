import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { PageHeader, Icon, Stat } from '../components/ui'
import { MARKETS, CF_SKUS } from '../data/products'

interface N { id: string; col: number; label: string; sub?: string; tone: string }

export default function Impact() {
  const { s, go } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const items = s.change?.items ?? []
  const hasSL = items.some(i => i.attribute === 'shelfLife'), hasST = items.some(i => i.attribute === 'sterilization')
  const { nodes, edges } = useMemo(() => {
    const nodes: N[] = []
    const edges: [string, string][] = []
    const add = (n: N) => nodes.push(n)
    if (hasSL) add({ id: 'c-sl', col: 0, label: 'Shelf life 24→36 mo', sub: 'ECO-2026-0412', tone: '#b3261e' })
    if (hasST) add({ id: 'c-st', col: 0, label: 'Sterilization EO→R', sub: 'e-beam, from lot CF26B', tone: '#b3261e' })
    if (s.regAccepted) add({ id: 'c-reg', col: 0, label: 'ISO 15223-1 A1:2025', sub: 'Impl. Dec. (EU) 2026/1231', tone: '#9a6400' })
    if (hasSL) { add({ id: 'r-exp', col: 1, label: 'MDR §23.2(i) · 801.18', sub: 'time limit for safe use', tone: '#5647c2' }); add({ id: 'r-udi', col: 1, label: 'UDI-PI AI (17)', sub: '801.40 · Art. 27', tone: '#5647c2' }); edges.push(['c-sl', 'r-exp'], ['c-sl', 'r-udi']) }
    if (hasST) { add({ id: 'r-ster', col: 1, label: 'MDR §23.2(l) · §23.3', sub: 'sterile state + method', tone: '#5647c2' }); add({ id: 'r-ifu', col: 1, label: 'MDR §23.4 IFU', sub: 'sterilization info', tone: '#5647c2' }); edges.push(['c-st', 'r-ster'], ['c-st', 'r-ifu']) }
    if (s.regAccepted) { add({ id: 'r-rep', col: 1, label: 'MDR §23.2(d) + §23.1(h)', sub: 'AR + harmonised symbols', tone: '#5647c2' }); edges.push(['c-reg', 'r-rep']) }
    if (hasSL) { add({ id: 'e-ub', col: 2, label: 'Use-by date', tone: '#2457d6' }); add({ id: 'e-udi', col: 2, label: 'UDI carrier + HRI', tone: '#2457d6' }); edges.push(['r-exp', 'e-ub'], ['r-udi', 'e-udi']) }
    if (hasST) { add({ id: 'e-st', col: 2, label: 'Sterile symbol 5.2.4', tone: '#2457d6' }); add({ id: 'e-ifu', col: 2, label: 'IFU ref → Rev G', tone: '#2457d6' }); edges.push(['r-ster', 'e-st'], ['r-ifu', 'e-ifu']) }
    if (s.regAccepted) { add({ id: 'e-rep', col: 2, label: 'AR symbol 5.1.2', tone: '#2457d6' }); edges.push(['r-rep', 'e-rep']) }
    const lv = [['t-pouch', 'Pouch × 48'], ['t-carton', 'Carton × 48'], ['t-ship', 'Shipper × 48']]
    lv.forEach(([id, l]) => add({ id, col: 3, label: l, sub: 'template-driven', tone: '#1a7f5a' }))
    for (const e of nodes.filter(n => n.col === 2)) {
      const targets = e.id === 'e-st' ? ['t-pouch', 't-carton'] : e.id === 'e-rep' ? ['t-pouch', 't-carton'] : e.id === 'e-ifu' ? ['t-pouch', 't-carton'] : ['t-pouch', 't-carton', 't-ship']
      targets.forEach(t => edges.push([e.id, t]))
    }
    ;(Object.keys(MARKETS) as (keyof typeof MARKETS)[]).forEach(m => { add({ id: `m-${m}`, col: 4, label: `${MARKETS[m].flag} ${m}`, sub: `${MARKETS[m].langs.length} lang`, tone: '#17191d' }); lv.forEach(([id]) => edges.push([id, `m-${m}`])) })
    return { nodes, edges }
  }, [hasSL, hasST, s.regAccepted])

  if (!s.change) return (
    <>
      <PageHeader eyebrow="Step 4 · Smart change impact engine" title="Impact engine" crit={['C4', 'C5']} steps="5–6" desc="Submit a change first (step 3) to see the traversal." />
      <button className="btn" onClick={() => go('change')}>Go to Change Copilot</button>
    </>
  )

  const W = 1000, colX = [10, 215, 420, 625, 830], nw = 160, nh = 40
  const pos = new Map<string, [number, number]>()
  for (let c = 0; c < 5; c++) {
    const col = nodes.filter(n => n.col === c)
    const gap = c === 4 ? 48 : 58
    const total = col.length * gap
    col.forEach((n, i) => pos.set(n.id, [colX[c], 30 + (440 - total) / 2 + i * gap]))
  }
  const linked = sel ? new Set(edges.flatMap(([a, b]) => (a === sel || b === sel ? [a, b] : []))) : null
  const langs = new Set(Object.values(MARKETS).flatMap(m => m.langs)).size
  return (
    <>
      <PageHeader eyebrow="Step 4 · Smart change impact engine" title="Every affected label, found by traversal, not memory" crit={['C1', 'C4', 'C5']} steps="5–6"
        desc="The key risk the case names is missing affected labels. LabelTwin walks the graph: change → attribute → requirement clause → label element → template / packaging level → market. It is deterministic and exhaustive, and every edge carries its citation." />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card"><Stat v={(CF_SKUS.length * 8 * 3).toLocaleString()} l="labels impacted (48 SKUs × 8 markets × 3 levels)" tone="#b3261e" /></div>
        <div className="card"><Stat v={langs} l="languages across impacted markets" /></div>
        <div className="card"><Stat v={nodes.filter(n => n.col === 2).length} l="label elements changing per label" /></div>
        <div className="card"><Stat v="< 50 ms" l="graph traversal (vs ~4 working days of manual impact assessment)" tone="#1a7f5a" /></div>
      </div>
      <div className="card graph">
        <div className="between" style={{ marginBottom: 6 }}><h3 style={{ margin: 0 }}><Icon name="graph" /> Impact graph</h3><span className="tiny muted">Tap a node to trace its paths</span></div>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${W} 500`} style={{ minWidth: 720 }} role="img" aria-label="Impact graph">
            {['Change', 'Requirement', 'Label element', 'Packaging level', 'Market'].map((t, i) => <text key={t} x={colX[i] + nw / 2} y={16} textAnchor="middle" fontSize="12" fontWeight="700" fill="#68707a">{t.toUpperCase()}</text>)}
            {edges.map(([a, b], i) => {
              const [x1, y1] = pos.get(a)!, [x2, y2] = pos.get(b)!
              const on = !linked || (linked.has(a) && linked.has(b))
              return <path key={i} className="gedge fadein" d={`M${x1 + nw} ${y1 + nh / 2} C${x1 + nw + 40} ${y1 + nh / 2} ${x2 - 40} ${y2 + nh / 2} ${x2} ${y2 + nh / 2}`} stroke={on ? '#9fb6cc' : '#e8eef4'} opacity={on ? 0.9 : 0.4} style={{ animationDelay: `${i * 8}ms` }} />
            })}
            {nodes.map((n, i) => {
              const [x, y] = pos.get(n.id)!
              const on = !linked || linked.has(n.id)
              return (
                <g key={n.id} className="gnode fadein" transform={`translate(${x},${y})`} opacity={on ? 1 : 0.3} onClick={() => setSel(sel === n.id ? null : n.id)} style={{ animationDelay: `${n.col * 140 + i * 10}ms` }}>
                  <rect width={nw} height={nh} rx="9" fill="#fff" stroke={n.tone} strokeWidth={sel === n.id ? 2.6 : 1.5} />
                  <rect width="5" height={nh} rx="2" fill={n.tone} />
                  <text x="12" y={n.sub ? 17 : 24} fontSize="12" fontWeight="700" fill="#17191d">{n.label}</text>
                  {n.sub && <text x="12" y="31" fontSize="10" fill="#68707a">{n.sub}</text>}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Beyond the label: other controlled items impacted</h3>
          <div className="tablewrap"><table className="t"><tbody>
            <tr><td className="small"><b>IFU-CF-07</b></td><td className="small">Sterilization section → Rev G; eIFU site republish</td></tr>
            <tr><td className="small"><b>ERP material master</b></td><td className="small">Shelf life 24 → 36 (DG-07 sync task)</td></tr>
            <tr><td className="small"><b>GUDID · EUDAMED</b></td><td className="small">Sterilization method attribute; DI unchanged (no new UDI-DI trigger)</td></tr>
            <tr><td className="small"><b>RIM</b></td><td className="small">US PMA supplement · EU NB change notification: release gate per market</td></tr>
            <tr><td className="small"><b>Risk file</b></td><td className="small">RC-12 storage statement unchanged; linked, so no new warning text</td></tr>
          </tbody></table></div>
        </div>
        <div className="card">
          <h3>Why a graph beats a spreadsheet</h3>
          <p className="small" style={{ margin: 0 }}>Today impact lists live in spreadsheets and expert memory, and shipper and pouch labels are the usual omissions. In openFDA, <b>Labeling Change Control</b> was the #1 labeling recall root cause in 2023–24 (104 records). The graph makes omission structurally impossible: if an element is derived from the changed attribute, every label containing that element is in the result set.</p>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => go('studio')}>Compile the impacted labels <Icon name="arrow" size={16} /></button>
        </div>
      </div>
    </>
  )
}
