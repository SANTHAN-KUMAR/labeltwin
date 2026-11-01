import { useState } from 'react'
import { useStore, worldAfter, BEFORE } from '../state/store'
import { PageHeader, Icon, download } from '../components/ui'
import { verifyChain, publicKeyJwk, lbomHash, type ChainCheck, type LedgerEvent } from '../engine/ledger'
import { compileLabel } from '../engine/compile'
import { CF_SKUS } from '../data/products'
import { REQUIREMENTS } from '../data/requirements'

export default function Audit() {
  const { s } = useStore()
  const [res, setRes] = useState<(ChainCheck & { tampered?: boolean }) | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const w = s.change ? worldAfter(s) : BEFORE
  const model = compileLabel(CF_SKUS.find(x => x.ref === s.selection.sku)!, s.selection.market, s.selection.level, w)
  const lbom = {
    lbomVersion: '1.0', label: model.key, revision: model.rev, template: `TPL-${model.level.toUpperCase()}`, changeOrder: s.lco,
    elements: model.elements.map(e => ({ id: e.id, value: e.value, symbol: e.symbol, source: e.prov, requirements: e.reqs.map(r => { const q = REQUIREMENTS.find(x => x.id === r)!; return { id: r, citation: `${q.source} ${q.clause}`, url: q.url } }) })),
    approvals: s.signatures.map(x => ({ role: x.role, name: x.name, meaning: x.meaning, ts: x.ts, ledgerHash: x.hash })),
  }
  const prov = {
    prefix: { lt: 'https://labeltwin.example/ns#', prov: 'http://www.w3.org/ns/prov#' },
    entity: Object.fromEntries(model.elements.map(e => [`lt:${model.key}#${e.id}`, { 'prov:value': e.value }])),
    wasDerivedFrom: Object.fromEntries(model.elements.map((e, i) => [`_:d${i}`, { 'prov:generatedEntity': `lt:${model.key}#${e.id}`, 'prov:usedEntity': `lt:src/${e.prov.system}/${e.prov.record}` }])),
    wasInfluencedBy: Object.fromEntries(model.elements.flatMap((e, i) => e.reqs.map((r, j) => [`_:i${i}_${j}`, { 'prov:influencee': `lt:${model.key}#${e.id}`, 'prov:influencer': `lt:req/${r}` }]))),
  }
  const check = async (tamper: boolean) => {
    let chain: LedgerEvent[] = s.ledger
    if (tamper && chain.length > 3) chain = chain.map((e, i) => (i === 3 ? { ...e, detail: e.detail.replace(/\d/, '9') + ' (edited)' } : e))
    const r = await verifyChain(chain)
    setRes({ ...r, tampered: tamper })
  }
  return (
    <>
      <PageHeader eyebrow="Step 10 · Traceability & auditability" title="Prove it: ledger, LBOM, provenance" crit={['C7', 'C6']} steps="12–14"
        desc="Every action (reconcile, accept, change, compile, verify, fix, sign, release) is an append-only record chained by SHA-256, with signed approvals. Each label revision has a Label Bill of Materials: element → source → requirement → approval → change order." />
      <div className="grid g-side">
        <div className="card">
          <div className="between"><h3 style={{ margin: 0 }}><Icon name="chain" /> Audit ledger · {s.ledger.length} records</h3>
            <div className="row"><button className="btn sm" onClick={() => check(false)}>Verify chain</button><button className="btn sm ghost" onClick={() => check(true)}>Tamper with record #4</button></div></div>
          {res && <div className={`callout ${res.ok ? '' : 'red'}`} style={{ marginTop: 10 }}>{res.ok ? `✓ Chain intact: ${res.checked} records, ${res.sigOk} signatures verified (ECDSA P-256).` : `✕ Chain broken at record #${res.brokenAt}: hash mismatch${res.tampered ? ' (a single edited character in record #4 invalidates everything after it)' : ''}.`}</div>}
          <div className="tablewrap" style={{ marginTop: 10, maxHeight: 460, overflowY: 'auto' }}><table className="t"><thead><tr><th>#</th><th>Event</th><th>Hash</th></tr></thead><tbody>
            {[...s.ledger].reverse().map(e => (
              <tr key={e.seq}><td className="mono tiny">{e.seq}</td><td className="small"><b>{e.action}</b> · {e.object}{e.signature && <span className="badge b-violet" style={{ marginLeft: 6 }}>signed · {e.meaning}</span>}<div className="tiny muted">{e.actor} ({e.role}) · {e.ts.replace('T', ' ').slice(0, 19)}</div><div className="tiny">{e.detail}</div></td><td className="hash" style={{ maxWidth: 160 }}>{e.hash.slice(0, 20)}…<br />prev {e.prevHash.slice(0, 8)}…</td></tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h3>Label Bill of Materials</h3>
            <p className="sub">{model.key.replace(/\|/g, ' · ')} · {model.elements.length} elements</p>
            <div className="row">
              <button className="btn sm" onClick={async () => setHash(await lbomHash(lbom))}>Compute LBOM hash</button>
              <button className="btn sm ghost" onClick={() => download(`LBOM-${model.key.replace(/\|/g, '_')}.json`, JSON.stringify(lbom, null, 2))}><Icon name="download" size={14} /> LBOM</button>
              <button className="btn sm ghost" onClick={() => download(`PROV-${model.key.replace(/\|/g, '_')}.json`, JSON.stringify(prov, null, 2))}><Icon name="download" size={14} /> W3C PROV</button>
              <button className="btn sm ghost" onClick={async () => download('ledger-public-key.jwk.json', JSON.stringify(await publicKeyJwk(), null, 2))}>Public key</button>
            </div>
            {hash && <div className="hash" style={{ marginTop: 8 }}>SHA-256 {hash}</div>}
          </div>
          <div className="card">
            <h3>Answering the auditor</h3>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              <li><b>"Why is this symbol here?"</b> Tap it on the Compile page: requirement clause, symbol version, source record, approval.</li>
              <li><b>"Which labels did ECO-2026-0412 touch?"</b> The impact set, frozen in {s.lco ?? 'the LCO'}.</li>
              <li><b>"Was labeling examined before release?" (QMSR §820.45(a))</b> The verification run is in the ledger with results.</li>
              <li><b>"Who approved, when, with what meaning?" (Part 11)</b> Signed ledger records.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
