import { useState } from 'react'
import { PageHeader, Icon, Stat } from '../components/ui'
import { runGolden, DEFECTS, type GoldenResult } from '../engine/golden'
import { worldAfter } from '../state/store'

// A fully corrected Rev G world is the reference: any failure on a clean label is a false positive.
const CLEAN_WORLD = worldAfter({ change: { product: 'CoroFlex', productId: 'CF', confidence: 1, unparsed: [], items: [{ attribute: 'shelfLife', from: '24', to: '36' }, { attribute: 'sterilization', from: 'EO', to: 'R' }] }, regAccepted: true, fixes: { de: true, shipper: true } })
const CTX = { currentIfuRev: 'IFU-CF-07 Rev G', shelfLife: 36, sterilization: 'R' as const, regAccepted: true }

export default function Validation() {
  const [n, setN] = useState(1000)
  const [res, setRes] = useState<GoldenResult | null>(null)
  const [busy, setBusy] = useState(false)
  const run = () => { setBusy(true); setTimeout(() => { setRes(runGolden(n, CLEAN_WORLD, CTX, 2026 + n)); setBusy(false) }, 30) }
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`
  return (
    <>
      <PageHeader eyebrow="Accuracy & validation" title="Validation lab: measure, don't claim" crit={['C6']}
        desc="Each rule and model version must pass a golden-set gate before it ships. The generator compiles real labels, injects one of 14 defect types into 70% of them (the classes behind real FDA recalls), and runs the same Verification Suite that gates release. Clean labels measure false positives."
        right={<div className="row"><div className="seg">{[200, 1000, 3000].map(x => <button key={x} className={n === x ? 'on' : ''} onClick={() => setN(x)}>{x.toLocaleString()}</button>)}</div><button className="btn teal" onClick={run} disabled={busy}><Icon name="shield" size={16} /> {busy ? 'Running…' : 'Run golden set'}</button></div>} />
      {!res && <div className="card"><p className="small" style={{ margin: 0 }}>Defect classes: {DEFECTS.map(d => d.name).join(' · ')}.</p></div>}
      {res && (
        <>
          <div className="grid g4" style={{ marginBottom: 14 }}>
            <div className="card"><Stat v={pct(res.criticalRecall)} l="recall on critical defect classes (release gate = 100%)" tone={res.criticalRecall === 1 ? '#1b9e8a' : '#d6334a'} /></div>
            <div className="card"><Stat v={pct(res.recall)} l={`overall recall (${(res.n - res.clean).toLocaleString()} injected defects)`} /></div>
            <div className="card"><Stat v={pct(res.precision)} l={`precision · ${res.falsePos} false positives on ${res.clean} clean labels`} tone={res.falsePos ? '#e29a2d' : '#1b9e8a'} /></div>
            <div className="card"><Stat v={`${res.ms.toFixed(0)} ms`} l={`${res.n.toLocaleString()} labels compiled, mutated, verified`} /></div>
          </div>
          <div className="card">
            <h3>Per defect class</h3>
            <div className="tablewrap"><table className="t"><thead><tr><th>Defect</th><th>Critical</th><th>Injected</th><th>Detected</th><th>By intended check</th><th>Recall</th></tr></thead><tbody>
              {res.perDefect.map(p => <tr key={p.id}><td className="small"><b>{p.name}</b></td><td>{p.critical ? <span className="badge b-fail">critical</span> : <span className="badge b-gray">major</span>}</td><td className="small">{p.injected}</td><td className="small">{p.detected}</td><td className="small">{p.byExpected}</td><td><span className={`badge ${p.detected === p.injected ? 'b-pass' : 'b-fail'}`}>{p.injected ? pct(p.detected / p.injected) : '—'}</span></td></tr>)}
            </tbody></table></div>
            {res.fpExamples.length > 0 && <div className="callout amber small" style={{ marginTop: 10 }}>False positives: {res.fpExamples.join(' · ')}</div>}
            <p className="tiny muted" style={{ marginBottom: 0 }}>Seeded and reproducible (seed {2026 + res.n}). "By intended check" confirms the defect was caught by the rule designed for it, not by coincidence. In production the golden set also includes the client's historical approved labels and scanned proofs with blur, noise and JPEG artefacts; OCR and vision components are measured the same way.</p>
          </div>
        </>
      )}
    </>
  )
}
