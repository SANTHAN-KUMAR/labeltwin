import { useEffect, useRef, useState } from 'react'
import { useStore, worldAfter, BEFORE } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon, Sev } from '../components/ui'
import { compileLabel, renderSvg } from '../engine/compile'
import { decodeImage, decodeSvg } from '../engine/raster'
import { CF_SKUS } from '../data/products'

export default function Release() {
  const { s, set, go } = useStore()
  const a = useActions()
  const [busy, setBusy] = useState(false)
  const [cam, setCam] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const w = s.change ? worldAfter(s) : BEFORE
  const expected = compileLabel(CF_SKUS.find(x => x.ref === 'CF-30018')!, 'EU', 'carton', w)

  const check = async (wrong: boolean) => {
    setBusy(true)
    const sku = CF_SKUS.find(x => x.ref === (wrong ? 'CF-30023' : 'CF-30018'))!
    const printed = compileLabel(sku, 'EU', 'carton', w)
    const r = (await decodeSvg(renderSvg(printed)))[0]
    const ok = r.ok && r.text === expected.udi!.text
    set({ lineChecks: [{ ok, text: `${wrong ? 'Station 3 · wrong roll loaded' : 'Station 3 · carton'}: decoded ${r.text ?? r.error} ${ok ? '= LBOM' : `≠ LBOM ${expected.udi!.text}`} (${r.ms.toFixed(0)} ms)`, ts: new Date().toISOString() }, ...s.lineChecks].slice(0, 8) })
    setBusy(false)
  }

  useEffect(() => {
    if (!cam) return
    let stop = false, stream: MediaStream | null = null
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const v = videoRef.current!; v.srcObject = stream; await v.play()
        const c = document.createElement('canvas')
        while (!stop) {
          c.width = v.videoWidth; c.height = v.videoHeight
          const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(v, 0, 0)
          const r = (await decodeImage(ctx.getImageData(0, 0, c.width, c.height)))[0]
          if (r.ok && r.text) {
            const ok = r.text === expected.udi!.text
            set({ lineChecks: [{ ok, text: `Camera scan: ${r.text} ${ok ? '= LBOM' : '≠ LBOM (stop line)'}`, ts: new Date().toISOString() }, ...s.lineChecks].slice(0, 8) })
            setCam(false); break
          }
          await new Promise(res => setTimeout(res, 250))
        }
      } catch { setCam(false) }
    })()
    return () => { stop = true; stream?.getTracks().forEach(t => t.stop()) }
  }, [cam]) // eslint-disable-line

  const ready = !!s.lco
  const pkg = [
    ['Compiled artwork → LMS (Loftware / PRISYM / BarTender) print queue', '1,152 labels · PDF/ZPL'],
    ['eIFU portal', 'IFU-CF-07 Rev G published; label eIFU URL unchanged'],
    ['GUDID payload', 'Sterilization method: Radiation (DI unchanged)'],
    ['EUDAMED UDI/Device payload', 'Sterilization attributes updated'],
    ['ERP material master', 'Shelf life 36 months (DG-07)'],
    ['RIM release gates', 'US: PMA supplement ✓ · EU: NB notification ✓ (recorded)'],
  ]
  return (
    <>
      <PageHeader eyebrow="Step 9 · Release, manufacturing, production" title="Release once, everywhere, then verify on the line" crit={['C5', 'C6', 'C7']} steps="16–19"
        desc="Release pushes one consistent package to every downstream system. At the line (Industry 4.0), each printed label and each sealed pack is decoded and matched to its LBOM before it moves. This is the control for the 17% of recall events that are physical mix-ups." />
      {!ready && <div className="callout amber" style={{ marginBottom: 14 }}>Release requires the change order (step 8). <button className="btn sm ghost" onClick={() => go('approve')}>Go to approval</button></div>}
      <div className="grid g2">
        <div className="card">
          <div className="between"><h3 style={{ margin: 0 }}><Icon name="truck" /> Release package</h3>{s.released ? <span className="badge b-pass">Released</span> : <button className="btn teal sm" disabled={!ready} onClick={() => a.release()}>Release</button>}</div>
          <div className="tablewrap" style={{ marginTop: 10 }}><table className="t"><tbody>
            {pkg.map(([k, v]) => <tr key={k}><td>{s.released ? <Sev s="pass" /> : <span className="badge b-gray">queued</span>}</td><td className="small"><b>{k}</b><div className="tiny muted">{v}</div></td></tr>)}
          </tbody></table></div>
        </div>
        <div className="card">
          <h3><Icon name="camera" /> Line-side verification</h3>
          <p className="sub">Each printed label is decoded on the line and compared with the released LBOM. The same check runs on a phone (AR-style guided QC) or a fixed camera.</p>
          <div className="row">
            <button className="btn" disabled={busy} onClick={() => check(false)}>Scan printed label</button>
            <button className="btn ghost" disabled={busy} onClick={() => check(true)}>Simulate mix-up</button>
            <button className="btn ghost" onClick={() => setCam(c => !c)}>{cam ? 'Stop camera' : 'Use camera'}</button>
          </div>
          {cam && <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 10, marginTop: 10, background: '#000' }} />}
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {s.lineChecks.map((c, i) => <div key={i} className={`callout ${c.ok ? '' : 'red'} small`} style={{ overflowWrap: 'anywhere' }}>{c.ok ? '✓ PASS' : '✕ STOP LINE'} · {c.text}</div>)}
          </div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>Tip: open this page on a phone, tap "Use camera" and point it at the label on the Compile page of a laptop.</p>
        </div>
      </div>
    </>
  )
}
