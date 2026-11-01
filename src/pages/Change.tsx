import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon } from '../components/ui'
import { EXAMPLE_REQUEST, parseChange } from '../engine/copilot'

type SR = { start: () => void; stop: () => void; lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void }

export default function Change() {
  const { s, go } = useStore()
  const a = useActions()
  const [text, setText] = useState(EXAMPLE_REQUEST)
  const [listening, setListening] = useState(false)
  const preview = useMemo(() => parseChange(text), [text])
  const cs = s.change ?? preview
  const Rec = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition
  const listen = () => {
    if (!Rec) return
    const r = new Rec(); r.lang = 'en-US'; r.interimResults = false
    r.onresult = e => setText(Array.from(e.results).map(x => x[0].transcript).join(' '))
    r.onend = () => setListening(false)
    setListening(true); r.start()
  }
  const actions = [
    ...(cs.items.some(i => i.attribute === 'shelfLife') ? ['Recompute use-by for all lots from effectivity; update ERP material master (DG-07)', 'Attach real-time aging report AR-0457 as objective evidence'] : []),
    ...(cs.items.some(i => i.attribute === 'sterilization') ? ['Swap sterile symbol 5.2.3 (EO) → 5.2.4 (R) on pouch and carton', 'IFU-CF-07: sterilization section → Rev G', 'RIM gating: PMA supplement (US) and notified-body change notification (EU) must be approved before release in those markets', 'Registry payloads: GUDID / EUDAMED sterilization method'] : []),
  ]
  return (
    <>
      <PageHeader eyebrow="Step 3 · Change Copilot (prompt / voice to label)" title="Describe the change in plain words" crit={['C3', 'C4', 'C5']} steps="1, 7, 13"
        desc="Engineers describe a product change in text or voice. The Copilot converts it into a schema-validated change set with evidence, then starts impact analysis and the change workflow. Output is constrained to a JSON schema: the model cannot invent fields, and low confidence routes to a human." />
      <div className="grid g-side">
        <div className="card">
          <h3><Icon name="pen" /> Change request</h3>
          <textarea rows={5} value={text} onChange={e => setText(e.target.value)} aria-label="Change request text" />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn teal" onClick={() => a.applyChange(text)}><Icon name="spark" size={16} /> Submit change</button>
            <button className="btn ghost" onClick={listen} disabled={!Rec || listening} title={Rec ? 'Dictate' : 'Speech recognition not available in this browser'}><Icon name="mic" size={16} /> {listening ? 'Listening…' : 'Dictate'}</button>
            <button className="btn ghost sm" onClick={() => setText(EXAMPLE_REQUEST)}>Reset example</button>
          </div>
          <div className="sep" />
          <div className="between"><b className="small">Structured change set (schema CR-v2)</b><span className={`badge ${cs.confidence >= 0.9 ? 'b-pass' : 'b-warn'}`}>confidence {cs.confidence.toFixed(2)}</span></div>
          <pre className="mono" style={{ background: '#17191d', color: '#cfe8ff', padding: 12, borderRadius: 10, overflowX: 'auto', fontSize: 12, marginTop: 8 }}>{JSON.stringify({ changeRequest: 'CR-2026-0907', linkedECO: 'ECO-2026-0412', product: cs.product, items: cs.items, effectivity: cs.effectivity, needsHuman: cs.confidence < 0.9 || cs.unparsed.length > 0 }, null, 2)}</pre>
          {cs.unparsed.map(u => <div key={u} className="callout amber small">{u}</div>)}
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h3>Required actions (generated)</h3>
            <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>{actions.map(x => <li key={x}>{x}</li>)}</ol>
          </div>
          <div className="card">
            <h3><Icon name="shield" /> Guardrails</h3>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
              <li>Constrained decoding to the CR schema; enum-only attributes</li>
              <li>Values cross-checked against PLM: the ECO must exist and be approved</li>
              <li>Private open-weight model (no data leaves the tenant)</li>
              <li>The Copilot proposes; the Labeling Engineer submits and owns the CR</li>
            </ul>
          </div>
          {s.change && <button className="btn" onClick={() => go('impact')}>See impact <Icon name="arrow" size={16} /></button>}
        </div>
      </div>
    </>
  )
}
