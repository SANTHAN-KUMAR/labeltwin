import { useMemo, useState } from 'react'
import { useStore, worldAfter, BEFORE } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon, Sev, Stat } from '../components/ui'
import { summarize, type Finding } from '../engine/verify'
import { compileLabel, renderSvg } from '../engine/compile'
import { decodeSvg, type DecodeResult } from '../engine/raster'
import { CF_SKUS, MARKETS } from '../data/products'
import { LANG_NAMES } from '../data/phrases'

const FAMS = ['Completeness', 'UDI', 'Dates', 'Symbols', 'Claims', 'Translation', 'Consistency', 'Layout']

export default function Verify() {
  const { s, go } = useStore()
  const a = useActions()
  const [filter, setFilter] = useState<'fail' | 'warn' | 'all'>('fail')
  const [dec, setDec] = useState<{ rows: { key: string; hri: string; res: DecodeResult }[]; running: boolean } | null>(null)
  const sm = s.verify ? summarize(s.verify.findings) : null
  const shown = useMemo(() => {
    if (!s.verify) return []
    const f = s.verify.findings.filter(x => filter === 'all' || x.sev === filter)
    const uniq = new Map<string, Finding & { count: number }>()
    for (const x of f) { const k = `${x.check}|${x.msg}`; const u = uniq.get(k); u ? u.count++ : uniq.set(k, { ...x, count: 1 }) }
    return [...uniq.values()].slice(0, 60)
  }, [s.verify, filter])

  const decodeBack = async () => {
    const w = s.change ? worldAfter(s) : BEFORE
    const picks = ['CF-22508', 'CF-30018', 'CF-40038'].flatMap(ref => (['EU', 'US', 'JP'] as const).flatMap(m => (['pouch', 'carton', 'shipper'] as const).map(l => ({ sku: CF_SKUS.find(x => x.ref === ref)!, m, l }))))
    setDec({ rows: [], running: true })
    const rows: { key: string; hri: string; res: DecodeResult }[] = []
    for (const p of picks) {
      const model = compileLabel(p.sku, p.m, p.l, w)
      const res = (await decodeSvg(renderSvg(model)))[0]
      rows.push({ key: `${p.sku.ref} · ${p.m} · ${p.l}`, hri: model.udi!.text, res })
      setDec({ rows: [...rows], running: true })
    }
    setDec({ rows, running: false })
  }
  const eu = useMemo(() => compileLabel(CF_SKUS.find(x => x.ref === 'CF-30018')!, 'EU', 'carton', s.change ? worldAfter(s) : BEFORE), [s])
  const enNums = (eu.langLines.find(l => l.lang === 'en')?.store ?? '').match(/\d+/g)?.join('|')

  return (
    <>
      <PageHeader eyebrow="Step 6 · Verification Suite (self-validating labels)" title="The same checks, every time, on every label" crit={['C6', 'C2', 'C4']} steps="15"
        desc="Every repetitive review the case lists (product number, manufacturer, symbols, UDI, dates, warnings, language, formatting) is a deterministic, version-controlled check that cites the requirement it protects. AI never gives the verdict; it proposes fixes."
        right={<div className="row"><button className="btn teal" onClick={() => a.verify()} disabled={!s.change && !s.verify && false}><Icon name="shield" size={16} /> Run suite</button></div>} />
      {!s.change && <div className="callout amber" style={{ marginBottom: 14 }}>No change submitted yet: the suite runs on the released Rev F labels. Even released labels reveal a latent risk (hard-coded fields in migrated templates). <button className="btn sm ghost" onClick={() => go('change')}>Submit the change</button></div>}
      {sm && (
        <>
          <div className="grid g4" style={{ marginBottom: 14 }}>
            <div className="card"><Stat v={sm.total.toLocaleString()} l={`checks on 1,152 labels in ${s.verify!.ms.toFixed(0)} ms (run #${s.verify!.run})`} /></div>
            <div className="card"><Stat v={sm.pass.toLocaleString()} l="passed" tone="#1a7f5a" /></div>
            <div className="card"><Stat v={sm.fail} l="failed (block release)" tone={sm.fail ? '#b3261e' : '#1a7f5a'} /></div>
            <div className="card"><Stat v={sm.warn} l="warnings (RA decision)" tone="#9a6400" /></div>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3>By check family</h3>
            <div className="grid g4" style={{ gap: 10 }}>
              {FAMS.map(f => { const x = sm.fams[f] ?? { pass: 0, fail: 0, warn: 0 }; const t = x.pass + x.fail + x.warn; return (
                <div key={f}><div className="between small"><b>{f}</b><span className="tiny muted">{t.toLocaleString()}</span></div><div className="bar"><i style={{ width: `${t ? (x.pass / t) * 100 : 0}%`, background: x.fail ? '#b3261e' : x.warn ? '#9a6400' : undefined }} /></div><div className="tiny muted">{x.fail} fail · {x.warn} warn</div></div>
              ) })}
            </div>
          </div>
          {sm.fail > 0 && (
            <div className="callout red" style={{ marginBottom: 14 }}>
              <b>Release blocked.</b> Root cause: hard-coded fields in templates migrated from the legacy LMS. (1) The German storage line says 30 °C instead of 25 °C. It is already in released Rev F, a latent defect that manual proofreading missed. (2) The shipper use-by is static text: it matched Rev F, and the shelf-life change made it stale. AI-proposed fix: re-bind the DE line to approved phrase PHR-0031 v3 and the shipper use-by to the derived expiry.
              <div style={{ marginTop: 8 }}><button className="btn teal sm" onClick={() => a.applyFixes()}>Accept fixes & re-verify</button></div>
            </div>
          )}
          {sm.fail === 0 && s.change && <div className="callout" style={{ marginBottom: 14 }}><b>All release-blocking checks pass.</b> {sm.warn ? `${sm.warn} warnings recorded for RA.` : ''} Evidence pack generated for QMSR §820.45(a).</div>}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="between"><h3 style={{ margin: 0 }}>Findings</h3><div className="seg">{(['fail', 'warn', 'all'] as const).map(x => <button key={x} className={filter === x ? 'on' : ''} onClick={() => setFilter(x)}>{x}</button>)}</div></div>
            <div className="tablewrap" style={{ marginTop: 8 }}><table className="t"><thead><tr><th>Result</th><th>Check</th><th>Finding</th><th>Requirement</th><th>Labels</th></tr></thead><tbody>
              {shown.length === 0 && <tr><td colSpan={5} className="small muted">No findings in this filter.</td></tr>}
              {shown.map((f, i) => <tr key={i}><td><Sev s={f.sev} /></td><td className="mono tiny">{f.check}</td><td className="small">{f.msg}</td><td className="tiny muted">{f.cite}</td><td className="small">{f.count}</td></tr>)}
            </tbody></table></div>
          </div>
        </>
      )}
      <div className="grid g2">
        <div className="card">
          <h3><Icon name="eye" /> UDI decode-back (zxing-cpp WASM)</h3>
          <p className="sub">Renders the actual artwork, decodes the barcode from pixels, and checks that decoded data = printed HRI = source record, with GS1 mode (symbology ]d2 / ]C1).</p>
          <button className="btn" onClick={decodeBack} disabled={dec?.running}>{dec?.running ? `Decoding ${dec.rows.length}/27…` : 'Decode 27 representative labels'}</button>
          {dec && <div className="tablewrap" style={{ marginTop: 10, maxHeight: 300, overflowY: 'auto' }}><table className="t"><tbody>
            {dec.rows.map(r => { const ok = r.res.ok && r.res.text === r.hri; return <tr key={r.key}><td>{ok ? <Sev s="pass" /> : <Sev s="fail" />}</td><td className="tiny"><b>{r.key}</b><div className="mono">{r.res.text ?? r.res.error}</div></td><td className="tiny mono">{r.res.symbologyId} · {r.res.ms.toFixed(0)}ms</td></tr> })}
          </tbody></table></div>}
        </div>
        <div className="card">
          <h3>Translation QA · EU carton ({eu.langLines.length} languages)</h3>
          <p className="sub">Number/unit parity vs source, placeholders, term base, back-translation similarity. Source values: {enNums} °C.</p>
          <div className="tablewrap" style={{ maxHeight: 340, overflowY: 'auto' }}><table className="t"><thead><tr><th>Lang</th><th>Storage statement</th><th>Parity</th></tr></thead><tbody>
            {eu.langLines.map(l => { const ok = (l.store ?? '').match(/\d+/g)?.join('|') === enNums; return <tr key={l.lang}><td className="small"><b>{l.lang.toUpperCase()}</b> <span className="tiny muted">{LANG_NAMES[l.lang]}</span></td><td className="small">{l.store}{l.storeSource === 'legacy-static' && <div><span className="badge b-warn">hard-coded legacy text</span></div>}</td><td>{ok ? <Sev s="pass" /> : <Sev s="fail" />}</td></tr> })}
          </tbody></table></div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>Market coverage: {Object.entries(MARKETS).map(([k, m]) => `${k} ${m.langs.length}`).join(' · ')}</p>
        </div>
      </div>
    </>
  )
}
