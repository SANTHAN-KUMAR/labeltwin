// Verification Suite: deterministic checks. Each check cites the requirement it protects.
import { addMonthsIso, isValidIsoDate, parseBracketed, validateElementString, aiMap } from './gs1'
import type { LabelModel } from './compile'
import { applicable } from '../data/requirements'
import { MARKETS } from '../data/products'
import { BACKTRANSLATION_SIM } from '../data/phrases'
import { SYMBOLS } from '../data/symbols'

export type Family = 'Completeness' | 'UDI' | 'Dates' | 'Symbols' | 'Claims' | 'Translation' | 'Consistency' | 'Layout'
export type Sev = 'pass' | 'fail' | 'warn'

export interface Finding {
  check: string
  family: Family
  sev: Sev
  label: string
  element?: string
  msg: string
  cite?: string
  fixId?: string
}

export interface VerifyCtx { currentIfuRev: string; shelfLife: number; sterilization: 'EO' | 'R'; regAccepted: boolean }

const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) || []).join('|')

export function verifyLabel(m: LabelModel, v: VerifyCtx): Finding[] {
  const out: Finding[] = []
  const label = m.key
  const push = (f: Omit<Finding, 'label'>) => out.push({ ...f, label })
  const el = (id: string) => m.elements.find(e => e.id === id)

  // ---- Completeness against the Requirement Graph ----
  for (const r of applicable({ market: m.market, level: m.level, fam: m.fam })) {
    const missing = r.requires.filter(e => !el(e))
    push({ check: 'COMP-01', family: 'Completeness', sev: missing.length ? 'fail' : 'pass', element: missing[0], msg: missing.length ? `Missing ${missing.join(', ')} required by ${r.clause}` : `${r.clause}: ${r.title}`, cite: `${r.source} ${r.clause}` })
  }

  // ---- UDI ----
  if (m.udi) {
    const issues = validateElementString(m.udi.text)
    const errs = issues.filter(i => i.severity === 'error')
    push({ check: 'UDI-01', family: 'UDI', sev: errs.length ? 'fail' : 'pass', element: 'udi', msg: errs.length ? errs.map(e => e.msg).join('; ') : 'GS1 AI syntax, check digit, YYMMDD and AI order valid', cite: 'GS1 General Specifications; 21 CFR 830.20' })
    const ai = aiMap(parseBracketed(m.udi.text))
    const expectInd = m.level === 'shipper' ? '1' : '0'
    push({ check: 'UDI-03', family: 'UDI', sev: ai['01']?.[0] === expectInd ? 'pass' : 'fail', element: 'udi', msg: `Packaging indicator digit ${ai['01']?.[0]} for ${m.level}`, cite: 'GS1 packaging hierarchy; MDR Annex VI Part C' })
    const lotEl = el('lot')?.value
    push({ check: 'UDI-02', family: 'UDI', sev: ai['10'] === lotEl ? 'pass' : 'fail', element: 'lot', msg: ai['10'] === lotEl ? 'HRI lot = barcode lot = batch record' : `Barcode lot ${ai['10']} ≠ printed lot ${lotEl}`, cite: '21 CFR 801.40(a); MDR Art. 27' })
  }

  // ---- Dates ----
  for (const id of ['useBy', 'mfgDate']) {
    const e = el(id)
    if (e) push({ check: 'DATE-01', family: 'Dates', sev: isValidIsoDate(e.value) ? 'pass' : 'fail', element: id, msg: `${e.label} ${e.value} in YYYY-MM-DD`, cite: '21 CFR 801.18; ISO 15223-1 5.1.3/5.1.4' })
  }
  const ub = el('useBy'), md = el('mfgDate')
  if (ub && md) {
    const derived = addMonthsIso(md.value, v.shelfLife)
    const ok = ub.value === derived
    push({ check: 'DATE-02', family: 'Dates', sev: ok ? 'pass' : 'fail', element: 'useBy', msg: ok ? `Use-by = mfg + ${v.shelfLife} mo (validated shelf life)` : `Use-by ${ub.value} ≠ derived ${derived} (mfg ${md.value} + ${v.shelfLife} mo)`, cite: 'MDR Annex I §23.2(i); QMSR §820.45(a)', fixId: ok ? undefined : 'FIX-SHIPPER-EXP' })
  }

  // ---- Symbols ----
  const st = el('sterile')
  if (st) {
    const expected = v.sterilization === 'EO' ? 'STERILE_EO' : 'STERILE_R'
    push({ check: 'SYM-01', family: 'Symbols', sev: st.symbol === expected ? 'pass' : 'fail', element: 'sterile', msg: `Sterile symbol ${SYMBOLS[st.symbol!].ref} matches sterilization spec`, cite: 'ISO 15223-1 5.2.x; MDR §23.2(l)' })
  }
  for (const e of m.elements.filter(e => e.symbol)) {
    const s = SYMBOLS[e.symbol!]
    if (s?.supersededBy) {
      push({ check: 'SYM-02', family: 'Symbols', sev: v.regAccepted ? 'warn' : 'pass', element: e.id, msg: v.regAccepted ? `${s.title} superseded by Amd 1:2025 (presumption ends ${s.validUntil}); adopt at this revision` : `${s.ref} valid (no superseding version accepted)`, cite: 'EN ISO 15223-1:2021/A1:2025; Impl. Dec. (EU) 2026/1231', fixId: v.regAccepted ? 'FIX-EUREP' : undefined })
    }
  }
  if (m.market === 'US' && m.level !== 'shipper') {
    const glossaryNeeded = m.elements.filter(e => e.symbol && SYMBOLS[e.symbol]?.fdaGlossary).length
    push({ check: 'SYM-03', family: 'Symbols', sev: el('ifu') ? 'pass' : 'fail', element: 'ifu', msg: `${glossaryNeeded} stand-alone symbols → symbols glossary referenced in IFU`, cite: '21 CFR 801.15(c)(1)(iii)(B)' })
  }

  // ---- Claims vs product master ----
  if (el('mr')) push({ check: 'CLM-01', family: 'Claims', sev: m.fam.mr === 'conditional' ? 'pass' : 'fail', element: 'mr', msg: 'MR Conditional claim backed by MR test report MRT-CF-02', cite: 'ASTM F2503; FDA MR labeling guidance' })
  if (el('medicinal')) push({ check: 'CLM-02', family: 'Claims', sev: m.fam.medicinal ? 'pass' : 'fail', element: 'medicinal', msg: 'Medicinal substance statement matches BOM (sirolimus)', cite: 'MDR Annex I §23.2(e)' })
  if (st) push({ check: 'CLM-03', family: 'Claims', sev: m.fam.sterile !== 'NONE' ? 'pass' : 'fail', element: 'sterile', msg: 'Sterile claim matches validated process', cite: 'MDR Annex I §23.2(l)' })

  // ---- Translation ----
  if (m.langLines.length) {
    const req = MARKETS[m.market].langs
    const missing = req.filter(l => !m.langLines.some(x => x.lang === l))
    push({ check: 'TRN-01', family: 'Translation', sev: missing.length ? 'fail' : 'pass', element: 'langPanel', msg: missing.length ? `Missing languages: ${missing.join(', ')}` : `${req.length}/${req.length} required languages present`, cite: m.market === 'EU' ? 'MDR Art. 10(11)' : 'National language rule' })
    const en = m.langLines.find(l => l.lang === 'en')?.store
    const ref = en ? numbers(en) : String(m.fam.storageMaxC ?? '')
    for (const l of m.langLines) {
      if (!l.store) continue
      const ok = numbers(l.store) === ref
      push({ check: 'TRN-02', family: 'Translation', sev: ok ? 'pass' : 'fail', element: 'langPanel', msg: ok ? `${l.lang.toUpperCase()} numbers/units match source` : `${l.lang.toUpperCase()} "${l.store}" ≠ source value ${ref} °C${l.storeSource === 'legacy-static' ? ' (hard-coded text in migrated template)' : ''}`, cite: 'Risk control RC-12; translation QA rule TQ-04', fixId: ok ? undefined : 'FIX-DE-STORE' })
      if (/[{}]/.test(l.text + l.store)) push({ check: 'TRN-03', family: 'Translation', sev: 'fail', element: 'langPanel', msg: `${l.lang} unresolved placeholder`, cite: 'TQ-02' })
      const sim = BACKTRANSLATION_SIM[l.lang]
      if (sim !== undefined) push({ check: 'TRN-04', family: 'Translation', sev: sim >= 0.9 ? 'pass' : 'warn', element: 'langPanel', msg: `${l.lang.toUpperCase()} back-translation similarity ${sim.toFixed(2)} (≥0.90)`, cite: 'TQ-07 semantic equivalence' })
    }
  }

  // ---- Consistency ----
  const ifu = el('ifu')
  if (ifu) push({ check: 'CON-02', family: 'Consistency', sev: ifu.value.startsWith(v.currentIfuRev) ? 'pass' : 'fail', element: 'ifu', msg: `IFU reference ${ifu.value.split(' · ')[0]} = current DMS revision`, cite: 'QMSR §820.45(c) mix-up prevention' })

  // ---- Layout & legibility (geometry) ----
  for (const e of m.elements) {
    const [x, y, w, h] = e.bbox
    const inside = x >= 0 && y >= 0 && x + w <= m.w + 0.5 && y + h <= m.h + 0.5
    if (!inside) push({ check: 'LAY-02', family: 'Layout', sev: 'fail', element: e.id, msg: `${e.label} outside printable area`, cite: 'LAY-02' })
  }
  if (m.langLines.length) push({ check: 'LAY-01', family: 'Layout', sev: m.langFont >= 5.6 ? 'pass' : 'fail', element: 'langPanel', msg: `Language panel ${m.langCols} col × ${m.langFont}px (min 5.6px)${m.layoutNote ? ' · auto-layout applied' : ''}`, cite: 'IEC 62366-1 legibility; LAY-01' })
  const boxes = m.elements.filter(e => !['rev'].includes(e.id))
  let overlaps = 0
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [ax, ay, aw, ah] = boxes[i].bbox, [bx, by, bw, bh] = boxes[j].bbox
    if (ax < bx + bw - 1 && bx < ax + aw - 1 && ay < by + bh - 1 && by < ay + ah - 1) overlaps++
  }
  push({ check: 'LAY-03', family: 'Layout', sev: overlaps ? 'fail' : 'pass', msg: overlaps ? `${overlaps} element overlaps` : 'No element overlaps', cite: 'LAY-03' })
  return out
}

/** Cross-label checks (same lot / same SKU across packaging levels). */
export function verifyAcross(models: LabelModel[]): Finding[] {
  const out: Finding[] = []
  const bySku = new Map<string, LabelModel[]>()
  for (const m of models) { const k = `${m.sku.ref}|${m.market}`; bySku.set(k, [...(bySku.get(k) || []), m]) }
  for (const [k, ms] of bySku) {
    const exps = new Set(ms.map(m => m.expiryShown))
    out.push({ check: 'CON-01', family: 'Consistency', sev: exps.size > 1 ? 'fail' : 'pass', label: k, element: 'useBy', msg: exps.size > 1 ? `Pouch/carton/shipper disagree on use-by: ${[...exps].join(' vs ')}` : 'Use-by identical across packaging levels', cite: 'Inner/outer consistency (recall class CONSISTENCY)', fixId: exps.size > 1 ? 'FIX-SHIPPER-EXP' : undefined })
  }
  return out
}

export function summarize(f: Finding[]) {
  const fams: Record<string, { pass: number; fail: number; warn: number }> = {}
  for (const x of f) { fams[x.family] ??= { pass: 0, fail: 0, warn: 0 }; fams[x.family][x.sev]++ }
  return { total: f.length, pass: f.filter(x => x.sev === 'pass').length, fail: f.filter(x => x.sev === 'fail').length, warn: f.filter(x => x.sev === 'warn').length, fams }
}
