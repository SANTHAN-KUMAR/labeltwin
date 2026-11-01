import { useState } from 'react'
import { PageHeader, Icon, Stat } from '../components/ui'
import { RECALL_CLASSES, RECALL_EXAMPLES, RECALL_META, VSM, VSM_TOTAL } from '../data/evidence'

const TONE: Record<string, string> = { auto: '#1b9e8a', line: '#1e9bd7', human: '#e29a2d', unclear: '#b8c2cc' }

export default function Insights() {
  const [live, setLive] = useState<string | null>(null)
  const total = RECALL_CLASSES.reduce((s, c) => s + c.n, 0)
  const auto = RECALL_CLASSES.filter(c => c.type === 'auto').reduce((s, c) => s + c.n, 0)
  const line = RECALL_CLASSES.filter(c => c.type === 'line').reduce((s, c) => s + c.n, 0)
  const max = Math.max(...RECALL_CLASSES.map(c => c.n))
  const refresh = async () => {
    setLive('Querying openFDA…')
    try {
      const r = await fetch('https://api.fda.gov/device/recall.json?search=root_cause_description:labeling&limit=1')
      const j = await r.json()
      setLive(`Live openFDA: ${j.meta.results.total.toLocaleString()} device recall records with a "Labeling…" root cause (dataset updated ${j.meta.last_updated}).`)
    } catch { setLive('openFDA not reachable from this network; showing the analysed snapshot (2026-10-29).') }
  }
  const vmax = Math.max(...VSM.map(v => v.before))
  return (
    <>
      <PageHeader eyebrow="Evidence & impact" title="Built on real failure data" crit={['C1', 'C6']} desc="We read all 218 FDA device recall events from 2023 to Oct 2026 whose root cause is labeling, and classified each by the control that would have prevented it. That analysis drives the design."
        right={<button className="btn ghost" onClick={refresh}><Icon name="radar" size={16} /> Refresh from openFDA</button>} />
      {live && <div className="callout sky" style={{ marginBottom: 14 }}>{live}</div>}
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card"><Stat v={`${Math.round(((auto + line) / total) * 100)}%`} l={`of ${total} events map to an automated (${Math.round((auto / total) * 100)}%) or line-side (${Math.round((line / total) * 100)}%) control`} tone="#1b9e8a" /></div>
        <div className="card"><Stat v={RECALL_META.longRun.labeling.toLocaleString()} l={`labeling-root-cause recalls 2003–2026 (${RECALL_META.longRun.pctAll}% of all, ${RECALL_META.longRun.pctAttributed}% of attributed)`} /></div>
        <div className="card"><Stat v="#1" l="Labeling Change Control is the top labeling root cause 2023–24 (104), then Labeling design (99)" tone="#d6334a" /></div>
        <div className="card"><Stat v={`−${Math.round((1 - VSM_TOTAL.after / VSM_TOTAL.before) * 100)}%`} l={`modelled cycle time per change (${VSM_TOTAL.before} → ${VSM_TOTAL.after} days)`} tone="#1e9bd7" /></div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>218 labeling-recall events by preventing control</h3>
          {RECALL_CLASSES.map(c => (
            <div key={c.id} style={{ marginBottom: 9 }}>
              <div className="between small"><span><b>{c.label}</b> <span className="muted tiny">· {c.control}</span></span><b>{c.n}</b></div>
              <div className="bar"><i style={{ width: `${(c.n / max) * 100}%`, background: TONE[c.type] }} /></div>
            </div>
          ))}
          <div className="row tiny" style={{ marginTop: 8 }}>{[['auto', 'Automated pre-release'], ['line', 'Line-side'], ['human', 'Expert judgment (accelerated)'], ['unclear', 'Unclear']].map(([k, l]) => <span key={k} className="row" style={{ gap: 5 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: TONE[k], display: 'inline-block' }} />{l}</span>)}</div>
          <p className="tiny muted">Method: openFDA device recalls, root_cause_description "labeling" or "expiration date", event_date_initiated 2023-01-01 to 2026-10-31 (480 product records → 218 events). Each event's reason was read and classified. Dataset updated {RECALL_META.lastUpdated}.</p>
        </div>
        <div className="card">
          <h3>Real examples the controls target</h3>
          <div className="tablewrap"><table className="t"><tbody>
            {RECALL_EXAMPLES.map(e => <tr key={e.firm + e.date}><td className="small" style={{ width: 130 }}><b>{e.firm}</b><div className="tiny muted">{e.date}</div></td><td className="small">{e.text}<div><span className="badge b-gray">{e.cls}</span></div></td></tr>)}
          </tbody></table></div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Value stream: one change × 30 labels × 20 languages (modelled, working days)</h3>
        <div className="tablewrap"><table className="t"><thead><tr><th>Step</th><th style={{ width: '42%' }}>Before → after</th><th>Mechanism</th></tr></thead><tbody>
          {VSM.map(v => (
            <tr key={v.step}><td className="small"><b>{v.step}</b></td>
              <td><div className="bar" style={{ background: '#fdecee' }}><i style={{ width: `${(v.before / vmax) * 100}%`, background: '#f0a6b1' }} /></div><div className="bar" style={{ marginTop: 3 }}><i style={{ width: `${(v.after / vmax) * 100}%` }} /></div><div className="tiny muted">{v.before} → {v.after} d</div></td>
              <td className="small">{v.how}</td></tr>
          ))}
        </tbody></table></div>
        <p className="tiny muted" style={{ marginBottom: 0 }}>Baseline durations are our model of the 19-step chain in the case. External anchors: Loftware/Quest Medical, 70% faster label turnaround (vendor case study); Tata Elxsi RegAI, up to 30% faster regulatory workflows; RegASK, label review from days to about 5 minutes per report. A shadow pilot validates the numbers on the client's own data.</p>
      </div>
    </>
  )
}
