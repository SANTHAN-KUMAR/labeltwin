import { useStore, PORTFOLIO_LABELS } from '../state/store'
import { CRITERIA, Icon, Stat } from '../components/ui'
import { RECALL_META, VSM_TOTAL } from '../data/evidence'

const STAGES = ['Product data', 'Markets', 'Requirements', 'Gaps', 'Content', 'Artwork', 'Review', 'Approval', 'Change order', 'Config control', 'Final QC', 'Release', 'Line', 'Production']

export default function Home() {
  const { set, go } = useStore()
  const cov: [keyof typeof CRITERIA, string, string][] = [
    ['C1', 'Problem framed from 218 real FDA labeling-recall events; 10 pain points mapped to controls', 'insights'],
    ['C2', 'Machine-readable Requirement Graph: MDR Annex I §23, 21 CFR 801/830, ISO 15223-1 + A1:2025, ISO 20417:2026, 8 markets', 'regwatch'],
    ['C3', 'Labels compiled from data: auto-layout, text-fit, GS1 DataMatrix, multilingual panels, GenAI only from approved phrases', 'studio'],
    ['C4', 'Agent mesh (RegWatch, Copilot, Impact, Vision, Translate-QA, Risk) each paired with a deterministic guard', 'architecture'],
    ['C5', 'All 19 steps from product data to production, as one connected flow', 'architecture'],
    ['C6', 'Deterministic checks, decode-back, golden-set recall gates, CSA / GAMP 5 validation', 'verify'],
    ['C7', 'Label Bill of Materials, element provenance, hash-chained Part 11 ledger, W3C PROV export', 'audit'],
  ]
  return (
    <div className="grid" style={{ gap: 18 }}>
      <section className="hero">
        <div className="k">Teliport S4 · Case Study 4 · Team Astute Computer</div>
        <h1>Stop authoring labels. <em>Compile them.</em></h1>
        <p>LabelTwin turns medical device labeling into a build pipeline. One source of truth compiles every label, deterministic tests verify it, and a signed Label Bill of Materials proves why every element exists. GenAI speeds everything around the compiler; it never has the final word on a label.</p>
        <div className="row">
          <button className="btn teal" onClick={() => set({ tourStep: 0 })}><Icon name="play" size={14} /> Start the 2½-minute demo</button>
          <button className="btn ghost" onClick={() => go('sources')}>Explore freely</button>
        </div>
        <div className="flow">{STAGES.map((x, i) => <span key={x} style={{ display: 'contents' }}><span>{x}</span>{i < STAGES.length - 1 && <span className="arrow">→</span>}</span>)}</div>
      </section>

      <div className="grid g4">
        <div className="card"><Stat v="69%" l="of 218 FDA labeling-recall events (2023–Oct 2026) map to a LabelTwin automated or line-side control" tone="#1b9e8a" /></div>
        <div className="card"><Stat v={RECALL_META.longRun.labeling.toLocaleString()} l={`device recalls with a labeling root cause since 2003 (openFDA, ${RECALL_META.longRun.pctAttributed}% of attributed)`} /></div>
        <div className="card"><Stat v={`−${Math.round((1 - VSM_TOTAL.after / VSM_TOTAL.before) * 100)}%`} l={`modelled change cycle time: ${VSM_TOTAL.before} → ${VSM_TOTAL.after} working days`} tone="#1e9bd7" /></div>
        <div className="card"><Stat v={PORTFOLIO_LABELS.toLocaleString()} l="labels in the demo portfolio, compiled from 3 templates per family" /></div>
      </div>

      <div className="grid g-side">
        <div className="card">
          <h3><Icon name="check" /> How each evaluation criterion shows up</h3>
          <div className="tablewrap"><table className="t"><tbody>
            {cov.map(([c, t, p]) => (
              <tr key={c}><td style={{ width: 170 }}><b>{CRITERIA[c]}</b></td><td className="small">{t}</td><td style={{ width: 70 }}><button className="btn ghost sm" onClick={() => go(p as never)}>See</button></td></tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="card">
          <h3><Icon name="spark" /> What runs for real in this browser</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li><b>GS1 UDI engine:</b> check digits, AI syntax, YYMMDD semantics, plus BWIPP's GS1 linter at encode time</li>
            <li><b>GS1 DataMatrix generation</b> (bwip-js) and <b>decode-back</b> from rendered artwork (zxing-cpp WASM)</li>
            <li><b>Label compiler</b> with requirement-driven content, auto-layout and real text measurement</li>
            <li><b>Verification Suite:</b> tens of thousands of checks across 1,152 labels in about a second</li>
            <li><b>Artwork diff:</b> registration + pixel diff + semantic region classification</li>
            <li><b>Ledger:</b> SHA-256 hash chain + ECDSA P-256 e-signatures (WebCrypto)</li>
          </ul>
          <div className="sep" />
          <p className="tiny muted" style={{ margin: 0 }}>Simulated in the prototype: enterprise connectors (PLM/ERP/RIM data is realistic sample data), LLM calls (the Change Copilot uses a deterministic extractor with the same output schema), and back-translation scores (precomputed). All companies, products and GTINs are fictional.</p>
        </div>
      </div>
    </div>
  )
}
