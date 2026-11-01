// Golden-set validation: synthesise labels, inject known defects, run the real Verification Suite,
// and measure per-defect recall and false positives on clean labels. This is the accuracy gate a rule
// or model version must pass before it ships (100% recall on critical classes).
import { compileLabel, type LabelModel, type World } from './compile'
import { verifyLabel, type VerifyCtx } from './verify'
import { CF_SKUS, FAMILIES, LEVELS, type LevelId } from '../data/products'

export interface DefectType { id: string; name: string; critical: boolean; checks: string[]; applies: (m: LabelModel) => boolean; inject: (m: LabelModel) => void }

const el = (m: LabelModel, id: string) => m.elements.find(e => e.id === id)
const setAi = (m: LabelModel, ai: string, v: string) => { if (m.udi) m.udi.text = m.udi.text.replace(new RegExp(`\\(${ai}\\)[^(]*`), `(${ai})${v}`) }
const yymmdd = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10)

export const DEFECTS: DefectType[] = [
  { id: 'EXP_SHIFT', name: 'Use-by date data-entry error', critical: true, checks: ['DATE-02'], applies: m => !!el(m, 'useBy'),
    inject: m => { const e = el(m, 'useBy')!; const d = new Date(e.value + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); e.value = d.toISOString().slice(0, 10); setAi(m, '17', yymmdd(e.value)) } },
  { id: 'MFG_AS_EXP', name: 'Manufacture date printed as expiry', critical: true, checks: ['DATE-02', 'UDI-01'], applies: m => !!el(m, 'useBy') && !!el(m, 'mfgDate'),
    inject: m => { const e = el(m, 'useBy')!; e.value = el(m, 'mfgDate')!.value; setAi(m, '17', yymmdd(e.value)) } },
  { id: 'DATE_FMT', name: 'Non-ISO date format (MM/DD/YYYY)', critical: true, checks: ['DATE-01'], applies: m => !!el(m, 'useBy'),
    inject: m => { const e = el(m, 'useBy')!; const [y, mo, d] = e.value.split('-'); e.value = `${mo}/${d}/${y}` } },
  { id: 'GTIN_CD', name: 'GTIN check digit corrupted', critical: true, checks: ['UDI-01'], applies: m => !!m.udi,
    inject: m => { const g = m.udi!.text.slice(4, 18); setAi(m, '01', g.slice(0, 13) + String((Number(g[13]) + 3) % 10)) } },
  { id: 'LOT_MISMATCH', name: 'Printed lot ≠ barcode lot', critical: true, checks: ['UDI-02'], applies: m => !!m.udi && !!el(m, 'lot'),
    inject: m => { el(m, 'lot')!.value = el(m, 'lot')!.value.replace(/\d$/, d => String((Number(d) + 1) % 10)) } },
  { id: 'MISSING_MD', name: 'MD symbol missing (EU)', critical: true, checks: ['COMP-01'], applies: m => !!el(m, 'md'),
    inject: m => { m.elements = m.elements.filter(e => e.id !== 'md') } },
  { id: 'MISSING_UDI', name: 'UDI carrier missing', critical: true, checks: ['COMP-01'], applies: m => !!el(m, 'udi') && m.level !== 'shipper' && el(m, 'udi')!.reqs.length > 0,
    inject: m => { m.elements = m.elements.filter(e => e.id !== 'udi'); m.udi = undefined } },
  { id: 'WRONG_STERILE', name: 'Wrong sterilization symbol', critical: true, checks: ['SYM-01'], applies: m => !!el(m, 'sterile'),
    inject: m => { el(m, 'sterile')!.symbol = 'STERILE_EO' } },
  { id: 'TRN_NUMBER', name: 'Translation number drift', critical: true, checks: ['TRN-02'], applies: m => m.langLines.filter(l => l.store).length > 1,
    inject: m => { const l = m.langLines.filter(x => x.store && x.lang !== 'en').at(-1)!; l.store = l.store!.replace(/\d+/, '30') } },
  { id: 'MISSING_LANG', name: 'Required language missing', critical: false, checks: ['TRN-01'], applies: m => m.langLines.length > 1,
    inject: m => { m.langLines = m.langLines.slice(0, -1) } },
  { id: 'INDICATOR', name: 'Shipper uses unit-level GTIN', critical: false, checks: ['UDI-03'], applies: m => m.level === 'shipper' && !!m.udi,
    inject: m => { setAi(m, '01', m.sku.gtinUnit) } },
  { id: 'IFU_REV', name: 'Superseded IFU revision referenced', critical: false, checks: ['CON-02'], applies: m => !!el(m, 'ifu'),
    inject: m => { const e = el(m, 'ifu')!; e.value = e.value.replace('Rev G', 'Rev F') } },
  { id: 'OUT_OF_BOUNDS', name: 'Element outside printable area', critical: false, checks: ['LAY-02'], applies: m => !!el(m, 'mfr'),
    inject: m => { const e = el(m, 'mfr')!; e.bbox = [e.bbox[0], m.h - 4, e.bbox[2], e.bbox[3]] } },
  { id: 'FALSE_CLAIM', name: 'MR claim without MR test evidence', critical: true, checks: ['CLM-01'], applies: m => !!el(m, 'mr'),
    inject: m => { m.fam = { ...m.fam, mr: 'none' } } },
]

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export interface GoldenResult {
  n: number; clean: number; falsePos: number; ms: number
  perDefect: { id: string; name: string; critical: boolean; injected: number; detected: number; byExpected: number }[]
  precision: number; recall: number; criticalRecall: number
  fpExamples: string[]
}

export function runGolden(n: number, world: World, v: VerifyCtx, seed = 2026): GoldenResult {
  const t0 = performance.now()
  const r = rng(seed)
  const fam = FAMILIES[0]
  const levels = Object.keys(LEVELS) as LevelId[]
  const per = new Map(DEFECTS.map(d => [d.id, { id: d.id, name: d.name, critical: d.critical, injected: 0, detected: 0, byExpected: 0 }]))
  let clean = 0, falsePos = 0, tp = 0
  const fpExamples: string[] = []
  for (let i = 0; i < n; i++) {
    const sku = CF_SKUS[Math.floor(r() * CF_SKUS.length)]
    const market = fam.markets[Math.floor(r() * fam.markets.length)]
    const level = levels[Math.floor(r() * levels.length)]
    const m = structuredClone(compileLabel(sku, market, level, world))
    const inject = r() < 0.7
    if (!inject) {
      clean++
      const fails = verifyLabel(m, v).filter(f => f.sev === 'fail')
      if (fails.length) { falsePos++; if (fpExamples.length < 5) fpExamples.push(`${m.key}: ${fails[0].check} ${fails[0].msg}`) }
      continue
    }
    const pool = DEFECTS.filter(d => d.applies(m))
    const d = pool[Math.floor(r() * pool.length)]
    d.inject(m)
    const fails = verifyLabel(m, v).filter(f => f.sev === 'fail')
    const s = per.get(d.id)!
    s.injected++
    if (fails.length) { s.detected++; tp++ }
    if (fails.some(f => d.checks.includes(f.check))) s.byExpected++
  }
  const injected = n - clean
  const perDefect = [...per.values()]
  const crit = perDefect.filter(p => p.critical)
  return {
    n, clean, falsePos, ms: performance.now() - t0, perDefect, fpExamples,
    precision: tp / Math.max(1, tp + falsePos), recall: tp / Math.max(1, injected),
    criticalRecall: crit.reduce((s, p) => s + p.detected, 0) / Math.max(1, crit.reduce((s, p) => s + p.injected, 0)),
  }
}
