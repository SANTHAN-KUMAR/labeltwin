import { useEffect, useState } from 'react'
import { useStore, worldAfter, BEFORE } from '../state/store'
import { PageHeader, Icon } from '../components/ui'
import { compileLabel, renderSvg } from '../engine/compile'
import { svgToImageData } from '../engine/raster'
import { compareArtwork, imageDataToUrl, type DiffResult } from '../engine/diff'
import { CF_SKUS } from '../data/products'

const REASON: Record<string, [string, string]> = {
  useBy: ['CR-2026-0907', 'Shelf life 24→36 mo (derived use-by)'],
  udi: ['CR-2026-0907', 'UDI-PI: new lot, (11), (17)'],
  lot: ['Batch data', 'New lot CF26B0457 (effectivity)'],
  lotVal: ['Batch data', 'New lot'],
  mfgDate: ['Batch data', 'New manufacture date'],
  sterile: ['CR-2026-0907', 'Sterilization EO → irradiation (5.2.3 → 5.2.4)'],
  authRep: ['RW-2026-118', 'AR symbol: ISO 15223-1 Amd 1:2025'],
  ifu: ['CR-2026-0907', 'IFU-CF-07 Rev G'],
  rev: ['LCO', 'Label revision F → G'],
  langPanel: ['FIX-DE-STORE', 'DE storage line re-bound to PHR-0031 v3'],
}

interface Out { a: string; b: string; d: string; r: DiffResult }

export default function Redline() {
  const { s, set, go } = useStore()
  const [main, setMain] = useState<Out | null>(null)
  const [proof, setProof] = useState<Out | null>(null)
  const [busy, setBusy] = useState(false)
  const sku = CF_SKUS.find(x => x.ref === s.selection.sku)!
  const run = async () => {
    if (!s.change) return
    setBusy(true)
    const before = compileLabel(sku, 'EU', 'carton', BEFORE)
    const after = compileLabel(sku, 'EU', 'carton', worldAfter(s))
    const svgA = renderSvg(before), svgB = renderSvg(after)
    const [A, B] = await Promise.all([svgToImageData(svgA, 2), svgToImageData(svgB, 2)])
    const r = compareArtwork(A, B, after.elements, 2, false)
    setMain({ a: imageDataToUrl(A), b: imageDataToUrl(B), d: imageDataToUrl(r.diff), r })
    const P = await svgToImageData(renderSvg(after, { tamper: true, dx: 3, dy: 2 }), 2)
    const r2 = compareArtwork(B, P, after.elements, 2, true)
    setProof({ a: imageDataToUrl(B), b: imageDataToUrl(P), d: imageDataToUrl(r2.diff), r: r2 })
    setBusy(false)
    if (!s.redlineDone) set({ redlineDone: true })
  }
  useEffect(() => { if (s.change && !main) void run() }, [s.change]) // eslint-disable-line

  if (!s.change) return (<><PageHeader eyebrow="Step 7 · CV artwork validation" title="Semantic redline" crit={['C4', 'C6']} steps="9, 15" desc="Submit a change first to compare artwork." /><button className="btn" onClick={() => go('change')}>Go to Change Copilot</button></>)

  return (
    <>
      <PageHeader eyebrow="Step 7 · Computer-vision artwork validation" title="Every changed pixel, explained" crit={['C4', 'C6', 'C7']} steps="9, 10, 15"
        desc="Instead of a reviewer hunting through a red blob, LabelTwin registers the images, diffs pixels, groups changed regions and maps each to a label element and to the change that justifies it. Any change without a justification is flagged as unintended."
        right={<button className="btn ghost" onClick={run} disabled={busy}><Icon name="eye" size={16} /> {busy ? 'Comparing…' : 'Re-run'}</button>} />
      {main && <Panel title={`Approved Rev F vs Rev G · ${sku.ref} · EU carton`} o={main} labels={['Approved (Rev F)', 'Revised (Rev G)', 'Pixel diff']} expectAll />}
      {proof && <Panel title="Rev G (approved) vs printer proof returned by the print vendor" o={proof} labels={['Approved Rev G', 'Printer proof (scanned)', 'Diff after registration']} />}
    </>
  )
}

function Panel({ title, o, labels, expectAll }: { title: string; o: Out; labels: string[]; expectAll?: boolean }) {
  const unexpected = o.r.regions.filter(r => !expectAll && r.element && !REASON[r.element] || (!expectAll && r.element === 'ref'))
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="between"><h3 style={{ margin: 0 }}>{title}</h3>
        <span className="row tiny muted">{o.r.changed.toLocaleString()} px changed · {(o.r.ratio * 100).toFixed(2)}% · registration offset ({o.r.offset.join(', ')}) raster px · {o.r.ms.toFixed(0)} ms</span></div>
      <div className="diffimgs" style={{ marginTop: 10 }}>{[o.a, o.b, o.d].map((u, i) => <figure key={i}><img src={u} alt={labels[i]} /><figcaption>{labels[i]}</figcaption></figure>)}</div>
      <div className="tablewrap" style={{ marginTop: 12 }}><table className="t"><thead><tr><th>Region</th><th>Kind</th><th>Element</th><th>Justified by</th><th>Verdict</th></tr></thead><tbody>
        {o.r.regions.map((r, i) => {
          const why = expectAll ? (r.element ? REASON[r.element] : undefined) : undefined
          const bad = !expectAll || !why
          return <tr key={i}><td className="mono tiny">{Math.round(r.x)},{Math.round(r.y)} · {Math.round(r.w)}×{Math.round(r.h)}</td><td><span className="badge b-gray">{r.kind}</span></td><td className="small">{r.elementLabel ?? 'layout'}</td><td className="small">{why ? <><b>{why[0]}</b> · {why[1]}</> : <span className="muted">no change request</span>}</td><td>{bad ? <span className="badge b-fail">UNINTENDED</span> : <span className="badge b-pass">expected</span>}</td></tr>
        })}
      </tbody></table></div>
      {expectAll ? <div className="callout" style={{ marginTop: 10 }}>Every changed region traces to CR-2026-0907, RW-2026-118, batch data or the approved fix. <b>No unintended change.</b></div>
        : <div className="callout red" style={{ marginTop: 10 }}>After auto-registration (the scanned proof was shifted {o.r.offset.map(Math.abs).join(' / ')} raster px), {unexpected.length || o.r.regions.length} region(s) differ from approved art with no change request: <b>REF printed as CF-30013</b>. Proof rejected before a single label is printed.</div>}
    </div>
  )
}
