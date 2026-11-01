import { useEffect, useState } from 'react'
import { useStore, type Page } from '../state/store'
import { useActions } from '../state/actions'
import { Icon } from './ui'

interface Step { page: Page; k: string; title: string; text: string; act?: string; run?: (a: ReturnType<typeof useActions>) => Promise<unknown> }

export const TOUR: Step[] = [
  { page: 'home', k: 'Guided demo · ~2½ min', title: 'One product change, end to end', text: 'A Class III drug-eluting stent changes shelf life and sterilization while EU symbol rules change. Watch LabelTwin compile, verify and prove 1,152 labels across 8 markets.' },
  { page: 'sources', k: 'Step 1 · Connect', title: 'One source of truth, conflicts surfaced', text: 'PLM says shelf life is 36 months (approved ECO), but ERP and the released labels still say 24. Governance rule DG-07 makes PLM the golden source.', act: 'Resolve conflict', run: a => a.resolveConflict('C1') },
  { page: 'regwatch', k: 'Step 2 · RegWatch', title: 'Regulation changed: EU harmonises ISO 15223-1 Amd 1', text: 'The bot reads the OJ notice and proposes a Requirement Graph delta. RA accepts. Old EC REP stays valid to 2031, so labels adopt it at their next revision.', act: 'Accept as RA', run: a => a.acceptReg() },
  { page: 'change', k: 'Step 3 · Change Copilot', title: 'Plain-English change → structured change set', text: 'The engineer types the change. It becomes a schema-validated change set with evidence links. No one retypes data into five systems.', act: 'Submit change', run: a => a.applyChange() },
  { page: 'impact', k: 'Step 4 · Impact engine', title: 'Every affected label found by graph traversal', text: 'Change → attributes → requirements → elements → 1,152 labels × 8 markets × 26 languages × 3 packaging levels. Deterministic, so nothing is missed.' },
  { page: 'studio', k: 'Step 5 · Compile', title: 'Labels are compiled, not drawn', text: 'One template per packaging level × data × rules. The GS1 DataMatrix is generated with GS1 lint checks. Tap any element to see why it exists.', act: 'Compile 1,152 labels', run: a => a.compile() },
  { page: 'verify', k: 'Step 6 · Verify', title: 'Tens of thousands of deterministic checks', text: 'Completeness against the Requirement Graph, UDI, dates, symbols, claims, translation, consistency, layout. It catches 2 latent defects hidden in migrated legacy templates.', act: 'Run verification', run: a => a.verify() },
  { page: 'verify', k: 'Step 6b · Fix', title: 'AI proposes the fix, engineer accepts, suite re-runs', text: 'Hard-coded text is re-bound to the approved phrase library and derived fields. Re-verification: zero failures. Barcodes are also decoded back from the rendered artwork.', act: 'Accept fixes', run: a => a.applyFixes() },
  { page: 'redline', k: 'Step 7 · Semantic redline', title: 'Computer vision explains every pixel that changed', text: 'Approved Rev F vs Rev G: every changed region is mapped to an element and to the change request. The printer proof is registered and compared, and an unintended REF change is caught.' },
  { page: 'approve', k: 'Step 8 · Approve', title: 'Risk-routed review with Part 11 e-signatures', text: 'An explainable risk score routes this High-risk change to RA, QA, Clinical and Labeling. Signatures are ECDSA-signed into the ledger. The change order is generated automatically.', act: 'Collect signatures', run: a => a.signAll() },
  { page: 'release', k: 'Step 9 · Release & line', title: 'Release, registries, and line-side verification', text: 'Release package to LMS, eIFU, GUDID and EUDAMED. On the line, each printed label is decoded and matched to its LBOM, so mix-ups stop here.', act: 'Release', run: a => a.release() },
  { page: 'audit', k: 'Step 10 · Prove', title: 'Tamper-evident audit trail + LBOM', text: 'Every action is a hash-chained, signed record. Export the Label Bill of Materials and W3C PROV. Try tampering: verification fails at the exact record.' },
  { page: 'insights', k: 'Outcome', title: 'Why it matters', text: '69% of 218 FDA labeling-recall events (2023–2026) map to a LabelTwin automated or line-side control. Modelled cycle time −71%. Explore freely, or restart the tour.' },
]

export function Tour() {
  const { s, set, go } = useStore()
  const a = useActions()
  const [busy, setBusy] = useState(false)
  const i = s.tourStep
  useEffect(() => { if (i !== null && TOUR[i] && s.page !== TOUR[i].page) go(TOUR[i].page) }, [i]) // eslint-disable-line
  if (i === null) return null
  const step = TOUR[i]
  const last = i === TOUR.length - 1
  const next = async () => {
    if (step.run) { setBusy(true); try { await step.run(a) } finally { setBusy(false) } }
    if (last) { set({ tourStep: null }); return }
    set({ tourStep: i + 1 })
  }
  return (
    <div className="tour" role="dialog" aria-live="polite">
      <div>
        <div className="k">{step.k} · {i + 1}/{TOUR.length}</div>
        <h4>{step.title}</h4>
        <p>{step.text}</p>
      </div>
      <div className="ctrl">
        {i > 0 && <button className="btn ghost sm" onClick={() => set({ tourStep: i - 1 })}>Back</button>}
        <button className="btn ghost sm" onClick={() => set({ tourStep: null })}>Exit</button>
        <button className="btn teal" disabled={busy} onClick={next}>{busy ? 'Working…' : step.act ? <>{step.act} <Icon name="arrow" size={16} /></> : last ? 'Finish' : <>Next <Icon name="arrow" size={16} /></>}</button>
      </div>
      <div className="prog"><i style={{ width: `${((i + 1) / TOUR.length) * 100}%` }} /></div>
    </div>
  )
}
