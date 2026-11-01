import { useMemo, useState } from 'react'
import { useStore, BEFORE, worldAfter } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon, Stat } from '../components/ui'
import { LabelView } from '../components/LabelView'
import { compileLabel } from '../engine/compile'
import { CF_SKUS, LEVELS, MARKETS, type LevelId, type MarketId } from '../data/products'

export default function Studio() {
  const { s, set } = useStore()
  const a = useActions()
  const [rev, setRev] = useState<'F' | 'G'>(s.change ? 'G' : 'F')
  const { sku: skuRef, market, level } = s.selection
  const sku = CF_SKUS.find(x => x.ref === skuRef)!
  const showG = rev === 'G' && !!s.change
  const world = showG ? worldAfter(s) : BEFORE
  const model = useMemo(() => compileLabel(sku, market, level, world), [sku, market, level, world])
  const changed = useMemo(() => {
    if (!showG) return []
    const before = compileLabel(sku, market, level, BEFORE)
    return model.elements.filter(e => { const b = before.elements.find(x => x.id === e.id); return !b || b.value !== e.value || b.symbol !== e.symbol }).map(e => e.id)
  }, [model, showG, sku, market, level])
  const sel = (patch: Partial<typeof s.selection>) => set({ selection: { ...s.selection, ...patch } })
  return (
    <>
      <PageHeader eyebrow="Step 5 · Label compiler (AI-assisted label design)" title="Labels are compiled, not drawn" crit={['C3', 'C5', 'C7']} steps="8–9, 12"
        desc="Template per packaging level × product master × Requirement Graph × symbol & phrase libraries → artwork. Content comes only from approved sources; layout is solved automatically (text-fit, columns, min font). Tap any element to see why it exists."
        right={<div className="row">{s.change && <button className="btn teal" onClick={() => a.compile()}><Icon name="spark" size={16} /> {s.compiled ? 'Recompile' : 'Compile 1,152 labels'}</button>}</div>} />
      {s.compiled && <div className="callout" style={{ marginBottom: 14 }}><b>{s.compiled.count.toLocaleString()} label models compiled in {s.compiled.ms.toFixed(0)} ms</b> in this browser from 3 templates (pouch, carton, shipper). Artwork renders on demand. The same inputs always give the same output and LBOM hash.</div>}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <select value={skuRef} onChange={e => sel({ sku: e.target.value })} aria-label="SKU">{CF_SKUS.map(x => <option key={x.ref} value={x.ref}>{x.ref} · Ø{x.diameter.toFixed(2)}×{x.length}</option>)}</select>
          <div className="seg" role="tablist" aria-label="Market">{(Object.keys(MARKETS) as MarketId[]).map(m => <button key={m} className={market === m ? 'on' : ''} onClick={() => sel({ market: m })}>{MARKETS[m].flag} {m}</button>)}</div>
          <div className="seg" aria-label="Packaging level">{(Object.keys(LEVELS) as LevelId[]).map(l => <button key={l} className={level === l ? 'on' : ''} onClick={() => sel({ level: l })}>{l}</button>)}</div>
          <div className="seg" aria-label="Revision"><button className={rev === 'F' ? 'on' : ''} onClick={() => setRev('F')}>Rev F (released)</button><button className={rev === 'G' ? 'on' : ''} disabled={!s.change} onClick={() => setRev('G')}>Rev G (change)</button></div>
        </div>
      </div>
      <div className="grid g-side">
        <div>
          <LabelView model={model} highlight={changed} />
          <div className="row tiny muted" style={{ marginTop: 8 }}>
            {changed.length > 0 && <span className="badge b-info">{changed.length} elements changed vs Rev F (highlighted)</span>}
            <span>{LEVELS[level].name} · {LEVELS[level].note}</span>
          </div>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h3>Label Bill of Materials</h3>
            <div className="grid g2" style={{ gap: 10, marginBottom: 10 }}>
              <Stat v={model.elements.length} l="elements, each traceable" />
              <Stat v={new Set(model.elements.flatMap(e => e.reqs)).size} l="requirement clauses satisfied" />
            </div>
            <div className="tablewrap" style={{ maxHeight: 320, overflowY: 'auto' }}><table className="t"><tbody>
              {model.elements.map(e => <tr key={e.id}><td className="small"><b>{e.label}</b><div className="tiny muted">{e.prov.system}</div></td><td className="tiny">{e.reqs.length ? e.reqs.join(', ') : <span className="muted">template</span>}</td></tr>)}
            </tbody></table></div>
          </div>
          <div className="card">
            <h3><Icon name="spark" /> Generative layout & content</h3>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
              <li>Required elements come from the Requirement Graph for <b>{market} · {level}</b>, not from a checklist.</li>
              <li>Symbols chosen by applicability rules (sterile method, single use, MR status, market).</li>
              <li>{model.layoutNote ?? (model.langLines.length ? `Language panel fits in ${model.langCols} column at ${model.langFont}px.` : 'No language panel required for this market/level.')}</li>
              <li>UDI: {model.udi?.text} encoded as {model.udi?.bcid === 'gs1-128' ? 'GS1-128' : 'GS1 DataMatrix'} with the GS1 linter on.</li>
              <li>GenAI Author drafts only from the approved phrase library; new wording is flagged NEW and routed to RA/Clinical.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
