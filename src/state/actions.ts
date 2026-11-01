import { useCallback } from 'react'
import { useStore, worldAfter } from './store'
import { parseChange, EXAMPLE_REQUEST } from '../engine/copilot'
import { scoreChange } from '../engine/risk'
import { CONFLICTS } from '../data/products'
import { REG_FEED } from '../data/regfeed'

const tick = (ms = 60) => new Promise(r => setTimeout(r, ms))

export const PEOPLE: Record<string, { name: string; meaning: string }> = {
  'Labeling Engineer': { name: 'A. Novak', meaning: 'Authorship' },
  'Regulatory Affairs': { name: 'R. Iyer', meaning: 'Approval' },
  'Quality Assurance': { name: 'M. Fischer', meaning: 'Approval' },
  'Clinical / Medical': { name: 'Dr. S. Okafor', meaning: 'Review' },
}

export function useActions() {
  const st = useStore()
  const { s, set, log, compileAll, runVerify } = st

  const resolveConflict = useCallback(async (id: string) => {
    if (s.resolved.includes(id)) return
    const c = CONFLICTS.find(x => x.id === id)!
    set({ resolved: [...s.resolved, id] })
    await log({ actor: 'A. Novak', role: 'Labeling Engineer', action: 'RECONCILE', object: c.entity, detail: `${c.attribute}: golden source ${c.golden} (${c.policy.split(':')[0]})` })
  }, [s.resolved, set, log])

  const acceptReg = useCallback(async (id = 'RW-2026-118') => {
    if (s.regAccepted) return
    const r = REG_FEED.find(x => x.id === id)!
    set({ regAccepted: true })
    await log({ actor: 'R. Iyer', role: 'Regulatory Affairs', action: 'ACCEPT-REG', object: r.id, detail: `Requirement Graph delta: ${r.delta}` })
  }, [s.regAccepted, set, log])

  const applyChange = useCallback(async (text = EXAMPLE_REQUEST) => {
    const cs = parseChange(text)
    set({ change: cs, compiled: null, verify: null, fixes: { de: false, shipper: false }, signatures: [], lco: null, released: false, redlineDone: false })
    await log({ actor: 'A. Novak', role: 'Labeling Engineer', action: 'CHANGE-REQUEST', object: 'CR-2026-0907 (ECO-2026-0412)', detail: cs.items.map(i => `${i.attribute}: ${i.from}→${i.to}`).join('; ') })
    return cs
  }, [set, log])

  const compile = useCallback(async () => {
    await tick()
    const t0 = performance.now()
    const models = compileAll()
    const ms = performance.now() - t0
    set({ compiled: { count: models.length, ms, at: new Date().toISOString() } })
    await log({ actor: 'system', role: 'LabelTwin', action: 'COMPILE', object: 'CoroFlex Rev G', detail: `${models.length.toLocaleString()} label models compiled in ${ms.toFixed(0)} ms (3 templates)` })
  }, [compileAll, set, log])

  const verify = useCallback(async () => { await tick(); await runVerify() }, [runVerify])

  const applyFixes = useCallback(async () => {
    set({ fixes: { de: true, shipper: true } })
    await log({ actor: 'A. Novak', role: 'Labeling Engineer', action: 'FIX', object: 'TPL-CARTON-02 / TPL-SHIPPER-01', detail: 'Removed hard-coded DE storage text → bound to PHR-0031 v3; removed static expiry → bound to derived use-by' })
    await tick(80)
    await runVerify()
  }, [set, log, runVerify])

  const risk = useCallback(() => {
    const w = worldAfter(s)
    return scoreChange({ deviceClass: 'III', implant: true, sterilizationChange: w.sterilization !== 'EO', shelfLifeChange: w.shelfLife !== 24, symbolChange: s.regAccepted || w.sterilization !== 'EO', markets: 8, languages: 26, newPhrases: 0, legacyOverridesFound: 2, priorLabelCapa: true, labelsImpacted: 1152 })
  }, [s])

  const sign = useCallback(async (role: string) => {
    if (s.signatures.some(x => x.role === role)) return
    const p = PEOPLE[role]
    const chain = await log({ actor: p.name, role, action: 'E-SIGN', object: 'CoroFlex Rev G (LBOM)', detail: `Electronic signature: ${p.meaning}`, meaning: p.meaning })
    const ev = chain[chain.length - 1]
    const sigs = [...s.signatures, { role, name: p.name, meaning: p.meaning, ts: ev.ts, hash: ev.hash }]
    const need = risk().reviewers
    const done = need.every(r => sigs.some(x => x.role === r))
    set({ signatures: sigs, ...(done && !s.lco ? { lco: 'LCO-2026-1187' } : {}) })
    if (done && !s.lco) await log({ actor: 'system', role: 'LabelTwin', action: 'LCO', object: 'LCO-2026-1187', detail: 'Change order auto-generated: 1,152 labels, 8 markets, evidence pack attached; pushed to PLM' })
  }, [s.signatures, s.lco, log, set, risk])

  const signAll = useCallback(async () => {
    const need = risk().reviewers
    let sigs = [...s.signatures]
    for (const role of need) {
      if (sigs.some(x => x.role === role)) continue
      const p = PEOPLE[role]
      const chain = await log({ actor: p.name, role, action: 'E-SIGN', object: 'CoroFlex Rev G (LBOM)', detail: `Electronic signature: ${p.meaning}`, meaning: p.meaning })
      const ev = chain[chain.length - 1]
      sigs = [...sigs, { role, name: p.name, meaning: p.meaning, ts: ev.ts, hash: ev.hash }]
    }
    set({ signatures: sigs, lco: 'LCO-2026-1187' })
    if (!s.lco) await log({ actor: 'system', role: 'LabelTwin', action: 'LCO', object: 'LCO-2026-1187', detail: 'Change order auto-generated: 1,152 labels, 8 markets, evidence pack attached; pushed to PLM' })
  }, [s.signatures, s.lco, log, set, risk])

  const release = useCallback(async () => {
    if (s.released) return
    set({ released: true })
    await log({ actor: 'system', role: 'LabelTwin', action: 'RELEASE', object: 'LCO-2026-1187', detail: 'Release package → LMS (print), eIFU portal, GUDID + EUDAMED payloads (sterilization method updated)' })
  }, [s.released, set, log])

  return { resolveConflict, acceptReg, applyChange, compile, verify, applyFixes, risk, sign, signAll, release }
}
