import { useMemo, useState } from 'react'
import { renderSvg, type El, type LabelModel } from '../engine/compile'
import { REQUIREMENTS } from '../data/requirements'
import { SYMBOLS } from '../data/symbols'
import { useStore } from '../state/store'
import { Icon } from './ui'

export function LabelView({ model, highlight, onPick }: { model: LabelModel; highlight?: string[]; onPick?: (e: El) => void }) {
  const svg = useMemo(() => renderSvg(model, { highlight }), [model, highlight])
  const [picked, setPicked] = useState<El | null>(null)
  const click = (ev: React.MouseEvent) => {
    const g = (ev.target as Element).closest('[data-el]')
    if (!g) return
    const e = model.elements.find(x => x.id === g.getAttribute('data-el'))
    if (!e) return
    onPick ? onPick(e) : setPicked(e)
  }
  return (
    <>
      <div className="labelbox"><div className="svgwrap" onClick={click} dangerouslySetInnerHTML={{ __html: svg }} /></div>
      {picked && <Provenance el={picked} model={model} onClose={() => setPicked(null)} />}
    </>
  )
}

export function Provenance({ el, model, onClose }: { el: El; model: LabelModel; onClose: () => void }) {
  const { s } = useStore()
  const reqs = REQUIREMENTS.filter(r => el.reqs.includes(r.id))
  const sym = el.symbol ? SYMBOLS[el.symbol] : undefined
  const sig = s.signatures.find(x => x.role === 'Regulatory Affairs')
  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Element provenance">
        <div className="between">
          <div><div className="tiny muted" style={{ fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Why is this on the label?</div><h3 style={{ fontSize: 19, marginTop: 4 }}>{el.label}</h3></div>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="callout sky" style={{ marginTop: 12, overflowWrap: 'anywhere' }}><b>Value:</b> {el.value}{el.derived && <div className="tiny" style={{ marginTop: 4 }}>Derived: {el.derived}</div>}</div>
        <div className="chain">
          <div className="node"><div className="k">Source of truth</div><b>{el.prov.system}</b><div className="small muted">{el.prov.record}</div></div>
          {reqs.length > 0 ? reqs.map(r => (
            <div className="node" key={r.id}><div className="k">Required by · {r.conf === 'V' ? 'verified primary text' : 'secondary source'}</div><b>{r.source} {r.clause}</b><div className="small muted">{r.title}</div><a className="tiny" href={r.url} target="_blank" rel="noreferrer">Open source ↗</a></div>
          )) : <div className="node"><div className="k">Required by</div><b>Template / company standard</b><div className="small muted">Not a regulatory element (e.g. revision block)</div></div>}
          {sym && <div className="node"><div className="k">Symbol library</div><b>{sym.standard} · ref {sym.ref}</b><div className="small muted">{sym.title}{sym.validUntil ? ` · valid until ${sym.validUntil}` : ''}{sym.fdaGlossary ? ' · in US symbols glossary' : ''}</div></div>}
          <div className="node"><div className="k">Label revision (LBOM)</div><b>{model.key.split('|').slice(0, 3).join(' · ')} · Rev {model.rev}</b><div className="small muted">Template {`TPL-${model.level.toUpperCase()}-0${model.level === 'carton' ? 2 : 1}`} · compiled deterministically</div></div>
          <div className="node"><div className="k">Approval</div>{model.rev === 'F' ? <><b>R. Iyer (Regulatory Affairs) · Approval</b><div className="small muted">2026-03-19 · LCO-2026-0311</div></> : sig ? <><b>{sig.name} ({sig.role}) · {sig.meaning}</b><div className="small muted">{sig.ts.replace('T', ' ').slice(0, 16)} UTC · {s.lco}</div></> : <><b>Pending approval</b><div className="small muted">Routed by risk tier in step 8</div></>}</div>
        </div>
        <p className="tiny muted">Exportable as W3C PROV-JSON from the Audit page. Every hop is a record in the hash-chained ledger.</p>
      </aside>
    </>
  )
}
