import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { compileLabel, WORLD_BEFORE, type LabelModel, type World } from '../engine/compile'
import { verifyAcross, verifyLabel, summarize, type Finding } from '../engine/verify'
import { appendEvent, type LedgerEvent } from '../engine/ledger'
import type { ChangeSet } from '../engine/copilot'
import { CF_SKUS, FAMILIES, LEVELS, type LevelId, type MarketId } from '../data/products'

export type Page = 'home' | 'sources' | 'regwatch' | 'change' | 'impact' | 'studio' | 'verify' | 'redline' | 'approve' | 'release' | 'audit' | 'insights' | 'validation' | 'architecture'

export interface Signature { role: string; name: string; meaning: string; ts: string; hash: string }

export interface AppState {
  page: Page
  resolved: string[]
  regAccepted: boolean
  change: ChangeSet | null
  fixes: { de: boolean; shipper: boolean }
  compiled: { count: number; ms: number; at: string } | null
  verify: { findings: Finding[]; ms: number; run: number } | null
  redlineDone: boolean
  signatures: Signature[]
  lco: string | null
  released: boolean
  lineChecks: { ok: boolean; text: string; ts: string }[]
  ledger: LedgerEvent[]
  selection: { sku: string; market: MarketId; level: LevelId }
  tourStep: number | null
}

const init: AppState = {
  page: 'home', resolved: [], regAccepted: false, change: null, fixes: { de: false, shipper: false }, compiled: null, verify: null,
  redlineDone: false, signatures: [], lco: null, released: false, lineChecks: [], ledger: [],
  selection: { sku: 'CF-30018', market: 'EU', level: 'carton' }, tourStep: null,
}

export function worldAfter(s: Pick<AppState, 'change' | 'regAccepted' | 'fixes'>): World {
  const sl = Number(s.change?.items.find(i => i.attribute === 'shelfLife')?.to ?? 24)
  const st = (s.change?.items.find(i => i.attribute === 'sterilization')?.to ?? 'EO') as 'EO' | 'R'
  return {
    rev: 'G', shelfLife: sl, sterilization: st, lot: { lot: 'CF26B0457', mfg: '2026-11-12' },
    authRepSymbol: s.regAccepted ? 'EU_REP' : 'EC_REP', legacyStaticText: !s.fixes.de, shipperExpiryOverride: s.fixes.shipper ? null : '2028-03-01',
  }
}
export const BEFORE: World = { ...WORLD_BEFORE, shipperExpiryOverride: '2028-03-01' }

export const PORTFOLIO = FAMILIES.map(f => ({ id: f.id, name: f.name, labels: f.skuCount * f.markets.length * 3, skus: f.skuCount, markets: f.markets.length }))
export const PORTFOLIO_LABELS = PORTFOLIO.reduce((s, p) => s + p.labels, 0)

interface Ctx {
  s: AppState
  go: (p: Page) => void
  set: (patch: Partial<AppState>) => void
  log: (e: { actor: string; role: string; action: string; object: string; detail: string; meaning?: string }) => Promise<LedgerEvent[]>
  world: World
  compileAll: () => LabelModel[]
  runVerify: () => Promise<void>
  reset: () => void
}

const C = createContext<Ctx | null>(null)

const SEED = [
  { ts: '2026-03-18T09:12:00Z', actor: 'A. Novak', role: 'Labeling Engineer', action: 'COMPILE', object: 'CoroFlex Rev F', detail: '1,152 labels compiled from TPL-POUCH-01/CARTON-02/SHIPPER-01' },
  { ts: '2026-03-19T14:03:00Z', actor: 'R. Iyer', role: 'Regulatory Affairs', action: 'E-SIGN', object: 'CoroFlex Rev F', detail: 'Approved for release (EU, US, UK, CH, JP, CN, AU, SA)', meaning: 'Approval' },
  { ts: '2026-03-20T08:30:00Z', actor: 'system', role: 'LabelTwin', action: 'RELEASE', object: 'LCO-2026-0311', detail: 'Released to LMS; GUDID/EUDAMED payloads synced' },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(init)
  const ref = useRef(s); ref.current = s
  const set = useCallback((patch: Partial<AppState>) => setS(p => ({ ...p, ...patch })), [])
  const go = useCallback((page: Page) => { setS(p => ({ ...p, page })); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  const chainRef = useRef<Promise<LedgerEvent[]>>(Promise.resolve([]))

  const log = useCallback((e: Parameters<Ctx['log']>[0] & { ts?: string }) => {
    chainRef.current = chainRef.current.then(async prev => {
      const next = await appendEvent(prev, e)
      setS(p => ({ ...p, ledger: next }))
      return next
    })
    return chainRef.current
  }, [])

  const seeded = useRef(false)
  useEffect(() => { if (seeded.current) return; seeded.current = true; for (const e of SEED) void log(e) }, [log])

  const world = useMemo(() => (s.change ? worldAfter(s) : BEFORE), [s.change, s.regAccepted, s.fixes])

  const compileAll = useCallback(() => {
    const w = ref.current.change ? worldAfter(ref.current) : BEFORE
    const out: LabelModel[] = []
    const fam = FAMILIES[0]
    for (const sku of CF_SKUS) for (const m of fam.markets) for (const lv of Object.keys(LEVELS) as LevelId[]) out.push(compileLabel(sku, m, lv, w))
    return out
  }, [])

  const runVerify = useCallback(async () => {
    const t0 = performance.now()
    const models = compileAll()
    const w = ref.current.change ? worldAfter(ref.current) : BEFORE
    const v = { currentIfuRev: 'IFU-CF-07 Rev G', shelfLife: w.shelfLife, sterilization: w.sterilization, regAccepted: ref.current.regAccepted }
    const findings = models.flatMap(m => verifyLabel(m, v)).concat(verifyAcross(models))
    const ms = performance.now() - t0
    const run = (ref.current.verify?.run ?? 0) + 1
    setS(p => ({ ...p, verify: { findings, ms, run } }))
    const sm = summarize(findings)
    await log({ actor: 'system', role: 'LabelTwin', action: 'VERIFY', object: `CoroFlex Rev ${w.rev}`, detail: `Run #${run}: ${sm.total.toLocaleString()} checks · ${sm.fail} fail · ${sm.warn} warn` })
  }, [compileAll, log])

  const reset = useCallback(() => {
    chainRef.current = chainRef.current.then(prev => prev.slice(0, SEED.length))
    setS(p => ({ ...init, ledger: p.ledger.slice(0, SEED.length), tourStep: null }))
    go('home')
  }, [go])

  return <C.Provider value={{ s, go, set, log, world, compileAll, runVerify, reset }}>{children}</C.Provider>
}

export function useStore() { const c = useContext(C); if (!c) throw new Error('no store'); return c }
