import { PageHeader } from '../components/ui'
import { useStore, type Page } from '../state/store'

const LAYERS = [
  { n: 'L1', name: 'Connect', tone: '#17191d', items: ['PLM · ERP · RIM · QMS / risk file', 'LMS archive (Loftware, PRISYM, BarTender)', 'TMS / termbase', 'GUDID · EUDAMED · AusUDID · swissdamed', 'Reg feeds: eCFR, Fed. Register, EUR-Lex/OJ, IMDRF, NMPA, TGA', 'Document AI migration of legacy labels'] },
  { n: 'L2', name: 'Labeling Knowledge Graph', tone: '#5647c2', items: ['Product Master Graph (variants, packaging, BOM, UDI-DI)', 'Requirement Graph (versioned, cited clauses)', 'Symbol Library (ISO 15223-1 + A1:2025, validity windows)', 'Phrase Library (approved × 26 languages)', 'Template Library (1 per packaging level)'] },
  { n: 'L3', name: 'AI Agent Mesh (each with a deterministic guard)', tone: '#2457d6', items: ['RegWatch → graph delta (RA approves)', 'Change Copilot → schema-validated CR', 'Impact Engine → graph traversal', 'Author → phrase-library-only drafting', 'Translate-QA · Vision (OCR/VLM, diff) · Risk Predictor'] },
  { n: 'L4', name: 'Compile & Verify', tone: '#1a7f5a', items: ['Label Compiler: variants, auto-layout, text-fit, GS1 DataMatrix', 'Verification Suite: 40+ checks, 8 families', 'UDI triangle + decode-back', 'LBOM + self-test report per label revision'] },
  { n: 'L5', name: 'Govern & Release', tone: '#9a6400', items: ['Risk-routed BPMN workflow', 'Part 11 e-signatures (ECDSA)', 'Auto-LCO → PLM; config baseline', 'Hash-chained ledger + W3C PROV', 'Release → LMS, eIFU, registries; line-side vision'] },
]

const STEPS: [string, string, Page][] = [
  ['Product / design information', 'Connect + reconciliation', 'sources'], ['Product understanding', 'Product Master Graph', 'sources'], ['Identify applicable markets', 'RIM registrations', 'sources'],
  ['Regulatory requirement assessment', 'Requirement Graph', 'regwatch'], ['Gap assessment', 'Graph query', 'impact'], ['Identify labeling gaps', 'Impact Engine', 'impact'],
  ['Gap addressal', 'Generated action list', 'change'], ['Label content development', 'Author (phrase library)', 'studio'], ['Redline / artwork modification', 'Compiler + semantic redline', 'redline'],
  ['Stakeholder review', 'Risk-routed, diff-only', 'approve'], ['Regulatory / quality approval', 'Part 11 e-signatures', 'approve'], ['Label revision', 'LBOM hash = revision', 'audit'],
  ['Change order creation', 'Auto-LCO', 'approve'], ['Document / configuration control', 'Ledger + baseline', 'audit'], ['Final quality check', 'Verification Suite + proof CV', 'verify'],
  ['Label release', 'Release package', 'release'], ['Manufacturing', 'Line-side decode vs LBOM', 'release'], ['Production implementation', 'Guided FAI (mobile/AR)', 'release'], ['Feedback (added)', 'Recalls/CAPA → risk model', 'insights'],
]

const STACK = [
  ['Graph + data', 'PostgreSQL + Apache AGE / Neo4j CE, SHACL', 'Neo4j Enterprise'],
  ['Document AI', 'Docling, PaddleOCR, Qwen3-VL (Apache-2.0)', 'Azure Document Intelligence'],
  ['LLM', 'Open-weight Qwen3 / Llama via vLLM, private', 'Azure OpenAI / Bedrock (client VPC)'],
  ['UDI', 'GS1 Syntax Engine, bwip-js / BWIPP, zxing-cpp', 'Certified ISO 15415 verifier at line'],
  ['Rules', 'GoRules ZEN / OPA (versioned, unit-tested)', '—'],
  ['Artwork', 'OpenCV, odiff / pixelmatch, pdf.js', 'GlobalVision / Esko as optional checkers'],
  ['Translation QA', 'Okapi CheckMate, LanguageTool, MetricX-24', 'LSP + TMS (RWS, XTM)'],
  ['Workflow + e-sign', 'Operaton / Flowable BPMN, PKI.js', 'Veeva / MasterControl integration'],
  ['Deploy', 'Kubernetes in client VPC or air-gapped', 'Managed by Tata Elxsi'],
]

export default function Architecture() {
  const { go } = useStore()
  return (
    <>
      <PageHeader eyebrow="Architecture" title="Five layers, two planes, one digital thread" crit={['C4', 'C5', 'C7']} steps="1–19"
        desc="LabelTwin is an AI layer on top of the client's existing PLM/ERP/LMS: it does not replace them. AI proposes; deterministic engines decide; humans approve; everything is recorded." />
      <div className="grid g-side">
        <div className="card">
          <div className="grid" style={{ gap: 8 }}>
            {LAYERS.map(l => (
              <div key={l.n} style={{ border: `1.5px solid ${l.tone}`, borderRadius: 12, padding: '10px 12px', background: '#fff' }}>
                <div className="row" style={{ gap: 8 }}><span className="badge" style={{ background: l.tone, color: '#fff' }}>{l.n}</span><b>{l.name}</b></div>
                <div className="chips" style={{ marginTop: 6 }}>{l.items.map(i => <span key={i} className="chip" style={{ background: '#f2f5f8', color: '#26394d' }}>{i}</span>)}</div>
              </div>
            ))}
            <div className="grid g2" style={{ gap: 8 }}>
              <div className="callout sky small"><b>Security & deployment plane:</b> client VPC or air-gapped; SSO/RBAC; encryption; tenant isolation; no data egress to public LLMs.</div>
              <div className="callout small"><b>Validation plane:</b> CSA + GAMP 5 (2nd ed.); golden-set recall gates; rule regression tests; model cards; drift monitoring on override rates.</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Accuracy & validation approach</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li><b>Decision rights:</b> AI proposes, deterministic validators decide, humans approve release.</li>
            <li><b>Platform validation:</b> ISO 13485 §4.1.6 / QMSR; risk-based CSA (scripted tests for UDI/date/completeness checks), Part 11 controls.</li>
            <li><b>Golden set:</b> synthetic generator renders thousands of labels with 14 injected defect types; per-check precision/recall; <b>100% recall gate on critical classes</b> before any rule or model ships.</li>
            <li><b>Shadow pilot:</b> 8–12 weeks alongside the human process, then risk-based reduction of manual review.</li>
            <li><b>AI controls:</b> schema-constrained output, confidence-based abstention, versioned prompts, open-weight private models.</li>
          </ul>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>End-to-end coverage of the case's process chain</h3>
          <div className="tablewrap"><table className="t"><tbody>
            {STEPS.map(([s, how, p], i) => <tr key={s}><td className="mono tiny">{i + 1}</td><td className="small"><b>{s}</b></td><td className="small">{how}</td><td><button className="btn ghost sm" onClick={() => go(p)}>Open</button></td></tr>)}
          </tbody></table></div>
        </div>
        <div className="card">
          <h3>Stack: free/open first, paid only where it adds value</h3>
          <div className="tablewrap"><table className="t"><thead><tr><th>Layer</th><th>Open / free</th><th>Paid upgrade</th></tr></thead><tbody>
            {STACK.map(([a, b, c]) => <tr key={a}><td className="small"><b>{a}</b></td><td className="small">{b}</td><td className="small muted">{c}</td></tr>)}
          </tbody></table></div>
          <div className="callout amber small" style={{ marginTop: 10 }}>Licence traps avoided: NLLB / CometKiwi / xCOMET (non-commercial), Ultralytics YOLO and PyMuPDF (AGPL), Marker/Surya weights (revenue-capped).</div>
        </div>
      </div>
    </>
  )
}
