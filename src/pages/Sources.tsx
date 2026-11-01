import { useStore } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon } from '../components/ui'
import { CONFLICTS, SOURCES } from '../data/products'

const LEGACY = [
  { f: 'Device name', v: 'VersaGrip™ Laparoscopic Grasper', c: 0.99 },
  { f: 'REF', v: 'VG-5320', c: 0.98 },
  { f: 'Manufacturer address', v: '…Minneapolis, MN 55402, USA', c: 0.96, flag: 'Conflicts with RIM (55401)' },
  { f: 'Symbols detected', v: 'MANUFACTURER, REF, LOT, EIFU, MD, NON-STERILE', c: 0.91 },
  { f: 'Reprocessing statement', v: '"Clean and sterilize before each use"', c: 0.88, flag: 'Below 0.90 confidence → human review' },
]

export default function Sources() {
  const { s } = useStore()
  const a = useActions()
  return (
    <>
      <PageHeader eyebrow="Step 1 · Connect layer" title="One source of truth, not five copies" crit={['C1', 'C4', 'C5']} steps="1–3"
        desc="LabelTwin reads (never re-types) product, regulatory, quality and label data. A reconciliation engine applies data-governance rules to pick a golden source per attribute, so conflicts surface before they reach artwork." />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        {SOURCES.map(x => (
          <div className="card" key={x.id} style={{ padding: 14 }}>
            <div className="between"><b>{x.name}</b><span className={`badge ${x.status === 'synced' || (x.id === 'erp' && s.resolved.includes('C1')) ? 'b-pass' : 'b-warn'}`}>{x.status === 'synced' || (x.id === 'erp' && s.resolved.includes('C1')) ? 'synced' : 'conflict'}</span></div>
            <div className="tiny muted">{x.kind}</div>
            <div className="small" style={{ marginTop: 6 }}>{x.product}</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>{x.records.toLocaleString()} records · {x.lastSync}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3><Icon name="db" /> Reconciliation: conflicts across systems</h3>
        <div className="grid" style={{ gap: 12 }}>
          {CONFLICTS.map(c => {
            const done = s.resolved.includes(c.id)
            return (
              <div key={c.id} className="card" style={{ boxShadow: 'none', borderColor: done ? '#bfe6df' : c.severity === 'high' ? '#f3c6cd' : '#f1dcb6', padding: 14 }}>
                <div className="between">
                  <div><b>{c.attribute}</b> <span className="muted small">· {c.entity}</span></div>
                  <span className={`badge ${done ? 'b-pass' : c.severity === 'high' ? 'b-fail' : 'b-warn'}`}>{done ? 'Resolved' : c.severity}</span>
                </div>
                <div className="tablewrap"><table className="t" style={{ marginTop: 6 }}><tbody>
                  {c.values.map(v => <tr key={v.source}><td style={{ width: 170 }} className="small"><b>{v.source}</b>{v.source.startsWith(c.golden) && <span className="badge b-pass" style={{ marginLeft: 6 }}>golden</span>}</td><td className="small">{v.value}</td></tr>)}
                </tbody></table></div>
                <div className="tiny muted" style={{ marginTop: 6 }}>{c.policy}</div>
                <div className="between" style={{ marginTop: 8 }}>
                  <span className="small">→ {c.resolution}</span>
                  {!done && <button className="btn sm teal" onClick={() => a.resolveConflict(c.id)}>Apply golden source</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3><Icon name="eye" /> Legacy label migration (Document AI)</h3>
          <p className="sub">6,940 approved legacy labels are read by OCR + a vision-language model into structured fields with per-field confidence. Anything below 0.90 goes to a human. Sample: VersaGrip Rev A.</p>
          <div className="tablewrap"><table className="t"><thead><tr><th>Field</th><th>Extracted</th><th>Conf.</th></tr></thead><tbody>
            {LEGACY.map(r => <tr key={r.f}><td className="small"><b>{r.f}</b></td><td className="small">{r.v}{r.flag && <div><span className="badge b-warn" style={{ marginTop: 4 }}>{r.flag}</span></div>}</td><td className="small mono">{r.c.toFixed(2)}</td></tr>)}
          </tbody></table></div>
        </div>
        <div className="card">
          <h3><Icon name="shield" /> How the Connect layer is built</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li>REST/OData connectors to PLM (Windchill/Agile/Teamcenter), ERP (SAP), RIM, eQMS. Event-driven on ECO/CR approval.</li>
            <li>RPA bots only for legacy UIs without APIs, logged like any user.</li>
            <li>Sits <b>on top of</b> existing LMS (Loftware, PRISYM, BarTender) and pushes compiled artwork to them. Nothing is ripped out.</li>
            <li>Golden-source policy per attribute (DG-01…DG-12) owned by Data Governance; conflicts block compile.</li>
            <li>UDI registries (GUDID, EUDAMED, AusUDID, swissdamed) are read-back sources for the UDI triangle check.</li>
          </ul>
        </div>
      </div>
    </>
  )
}
