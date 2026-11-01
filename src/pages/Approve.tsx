import { useStore } from '../state/store'
import { useActions, PEOPLE } from '../state/actions'
import { PageHeader, Icon, Stat, download } from '../components/ui'
import { summarize } from '../engine/verify'

export default function Approve() {
  const { s, go } = useStore()
  const a = useActions()
  const r = a.risk()
  const v = s.verify ? summarize(s.verify.findings) : null
  const blocked = !s.change || !v || v.fail > 0
  const lcoText = () => JSON.stringify({
    lco: s.lco, title: 'CoroFlex DES: shelf life 36 mo, irradiation sterilization, AR symbol (ISO 15223-1 A1:2025)', changeRequest: 'CR-2026-0907', eco: 'ECO-2026-0412', regulatoryItem: 'RW-2026-118',
    affected: { labels: 1152, skus: 48, markets: ['US', 'EU', 'UK', 'CH', 'JP', 'CN', 'AU', 'SA'], levels: ['pouch', 'carton', 'shipper'], documents: ['IFU-CF-07 Rev G'] },
    evidence: { verification: v, risk: { score: r.score, tier: r.tier }, redline: 'no unintended change', signatures: s.signatures },
    releaseGates: { US: 'PMA supplement approval (RIM)', EU: 'NB change notification (RIM)' },
  }, null, 2)
  return (
    <>
      <PageHeader eyebrow="Step 8 · Predictive risk + approval" title="Review effort where the risk is" crit={['C6', 'C7', 'C2']} steps="10–14"
        desc="An explainable risk score (case approach 8) sets how deep the human review goes: the computer-software-assurance mindset applied to labeling. Reviewers see only the semantic diff and the evidence pack, and sign with Part 11-compliant electronic signatures." />
      {blocked && <div className="callout amber" style={{ marginBottom: 14 }}>Approval opens only when the Verification Suite has zero release-blocking failures. <button className="btn sm ghost" onClick={() => go('verify')}>Go to Verify</button></div>}
      <div className="grid g-side">
        <div className="card">
          <div className="between"><h3 style={{ margin: 0 }}><Icon name="chart" /> Change risk score</h3><span className={`badge ${r.tier === 'High' ? 'b-fail' : r.tier === 'Medium' ? 'b-warn' : 'b-pass'}`}>{r.tier} risk</span></div>
          <div className="row" style={{ margin: '10px 0 14px' }}><Stat v={`${r.score}/100`} l="additive, explainable score" tone={r.tier === 'High' ? '#b3261e' : '#9a6400'} /></div>
          {r.features.map(f => (
            <div key={f.key} style={{ marginBottom: 8 }}>
              <div className="between small"><span>{f.label} <span className="muted">· {f.value}</span></span><b>+{f.points}</b></div>
              <div className="bar"><i style={{ width: `${(f.points / 20) * 100}%`, background: '#5647c2' }} /></div>
            </div>
          ))}
          <p className="tiny muted" style={{ marginBottom: 0 }}>Priors calibrated on the openFDA labeling-recall taxonomy (2023–2026); in production the model retrains on the client's CAPA, FAI and line-reject history. The score routes review; it never approves.</p>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h3><Icon name="pen" /> Required e-signatures ({r.reviewers.length})</h3>
            {r.reviewers.map(role => {
              const sig = s.signatures.find(x => x.role === role)
              return (
                <div key={role} className="between" style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="small"><b>{role}</b><div className="tiny muted">{PEOPLE[role].name} · meaning: {PEOPLE[role].meaning}</div>{sig && <div className="hash">signed {sig.ts.replace('T', ' ').slice(0, 19)} UTC · {sig.hash.slice(0, 16)}…</div>}</div>
                  {sig ? <span className="badge b-pass">✓ Signed</span> : <button className="btn sm teal" disabled={blocked} onClick={() => a.sign(role)}>Sign</button>}
                </div>
              )
            })}
            <button className="btn" style={{ marginTop: 12, width: '100%' }} disabled={blocked || !!s.lco} onClick={() => a.signAll()}>Collect all signatures</button>
            <p className="tiny muted" style={{ marginBottom: 0 }}>Each signature shows the signer's name, date/time and meaning (21 CFR 11.50). It is cryptographically bound to the record hash (11.70) with ECDSA P-256 and appended to the ledger.</p>
          </div>
          {s.lco && (
            <div className="card">
              <h3><Icon name="check" /> {s.lco} generated</h3>
              <p className="small" style={{ marginTop: 0 }}>Change order with affected items, reason, impact and the complete evidence pack. Pushed to PLM as the configuration-controlled record (step 13–14).</p>
              <div className="row"><button className="btn ghost sm" onClick={() => download(`${s.lco}.json`, lcoText())}><Icon name="download" size={14} /> Download LCO</button><button className="btn sm" onClick={() => go('release')}>Release <Icon name="arrow" size={14} /></button></div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
