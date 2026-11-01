// LabelTwin compiler: template x product master x requirement graph x libraries -> label model (+ SVG artwork).
// Deterministic: same inputs always produce the same label and the same LBOM hash.
import bwipjs from 'bwip-js/browser'
import { addMonthsIso, buildElementString, type UdiData } from './gs1'
import { applicable, type ElementId } from '../data/requirements'
import { COMPANY, FAMILIES, LEVELS, MARKETS, PROVENANCE_RECORDS, type Family, type LevelId, type MarketId, type Sku } from '../data/products'
import { LANG_NAMES, LEGACY_TM_OVERRIDES, PHRASES } from '../data/phrases'
import { SYMBOLS } from '../data/symbols'

export interface World {
  rev: string
  shelfLife: number
  sterilization: 'EO' | 'R'
  lot: { lot: string; mfg: string }
  authRepSymbol: 'EC_REP' | 'EU_REP'
  legacyStaticText: boolean      // migrated LMS template still carries hard-coded DE storage text
  shipperExpiryOverride: string | null  // migrated shipper template has a hard-coded expiry
  proofTamper?: boolean          // simulate an unintended change in a printer proof
}

export const WORLD_BEFORE: World = {
  rev: 'F', shelfLife: 24, sterilization: 'EO', lot: { lot: 'CF26A0391', mfg: '2026-03-02' }, authRepSymbol: 'EC_REP',
  legacyStaticText: true, shipperExpiryOverride: null,
}

export interface El {
  id: ElementId | 'rev' | 'storageText' | 'lotVal'
  label: string
  value: string
  symbol?: string
  bbox: [number, number, number, number]
  prov: { system: string; record: string }
  reqs: string[]
  derived?: string
}

export interface LangLine { lang: string; text: string; store?: string; storeSource: 'phrase' | 'legacy-static' }

export interface LabelModel {
  key: string
  sku: Sku
  fam: Family
  market: MarketId
  level: LevelId
  rev: string
  w: number
  h: number
  elements: El[]
  udi?: UdiData & { text: string; bcid: string }
  langLines: LangLine[]
  langCols: number
  langFont: number
  layoutNote?: string
  expiryShown?: string
  expiryDerived?: string
}

const fmt = (n: number) => (Number.isInteger(n) ? n.toFixed(2) : n.toFixed(2))
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k]))

// ---------- text measurement (real canvas metrics in browser, estimate elsewhere) ----------
let measureCtx: CanvasRenderingContext2D | null = null
export function textWidth(text: string, size: number, weight = 400): number {
  if (typeof document !== 'undefined') {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
    if (measureCtx) {
      measureCtx.font = `${weight} ${size}px Arial, Helvetica, "Noto Sans", sans-serif`
      return measureCtx.measureText(text).width
    }
  }
  let w = 0
  for (const ch of text) w += /[　-鿿가-힯]/.test(ch) ? size : size * 0.55
  return w
}

const MIN_FONT_PX = 5.6 // ≈ 1.4 mm x-height class at 4 px/mm; legibility rule LAY-01

export function compileLabel(sku: Sku, market: MarketId, level: LevelId, world: World): LabelModel {
  const fam = { ...FAMILIES.find(f => f.id === sku.family)!, shelfLifeMonths: world.shelfLife, sterile: world.sterilization } as Family
  const ctx = { market, level, fam }
  const reqs = applicable(ctx)
  const needed = new Map<ElementId, string[]>()
  for (const r of reqs) for (const e of r.requires) needed.set(e, [...(needed.get(e) || []), r.id])
  const has = (e: ElementId) => needed.has(e)
  const L = LEVELS[level]
  const els: El[] = []
  const add = (id: El['id'], label: string, value: string, bbox: El['bbox'], symbol?: string, derived?: string) =>
    els.push({ id, label, value, symbol, bbox, derived, prov: PROVENANCE_RECORDS[id as string] || { system: 'Template', record: `TPL-${level.toUpperCase()}-01` }, reqs: needed.get(id as ElementId) || [] })

  const derivedExp = addMonthsIso(world.lot.mfg, world.shelfLife)
  const shownExp = level === 'shipper' && world.shipperExpiryOverride ? world.shipperExpiryOverride : derivedExp
  const gtin = level === 'shipper' ? sku.gtinCase : sku.gtinUnit
  const udi: UdiData = { gtin, mfg: world.lot.mfg, exp: shownExp, lot: world.lot.lot }
  const udiText = buildElementString(udi)
  const W = L.w
  const headW = W - 132 - 30 - 16 // header must clear the UDI symbol + carrier block
  const descEn = PHRASES[fam.descKey]?.text.en ?? fam.name

  // ---- header ----
  add('name', 'Device name', fam.name, [12, 8, headW, 20])
  if (level !== 'shipper') add('desc', 'Description / intended purpose', descEn, [12, 30, headW, 12])
  add('size', 'Device size', `Ø ${fmt(sku.diameter)} mm × ${sku.length} mm`, [12, 44, 160, 12])
  add('rev', 'Label revision', `LBL-${sku.ref}-${market}-${level.slice(0, 2).toUpperCase()} Rev ${world.rev}`, [W - 150, 8, 140, 10])

  // ---- identification column ----
  let y = level === 'shipper' ? 64 : 62
  const row = (id: ElementId, sym: string, label: string, value: string, derived?: string) => { add(id, label, value, [12, y, 190, 22], sym, derived); y += 25 }
  row('ref', 'REF', 'Catalogue number', sku.ref)
  row('lot', 'LOT', 'Batch code', world.lot.lot)
  if (fam.shelfLifeMonths > 0) row('useBy', 'USE_BY', 'Use-by date', shownExp, level === 'shipper' && world.shipperExpiryOverride ? 'STATIC TEXT in migrated template' : `= ${world.lot.mfg} + ${world.shelfLife} months`)
  row('mfgDate', 'DATE_MFG', 'Date of manufacture', world.lot.mfg)
  if (level === 'shipper') add('qty', 'Contents', `${sku.caseQty} × ${sku.ref} cartons`, [12, y, 190, 14])

  // ---- symbol strip ----
  const strip: { id: ElementId; sym: string; label: string; value: string }[] = []
  if (level !== 'shipper') {
    if (fam.sterile !== 'NONE') strip.push({ id: 'sterile', sym: fam.sterile === 'EO' ? 'STERILE_EO' : 'STERILE_R', label: 'Sterilization method', value: fam.sterile === 'EO' ? 'Ethylene oxide' : 'Irradiation' })
    if (fam.sterile !== 'NONE') strip.push({ id: 'noResterilize', sym: 'NO_RESTERILIZE', label: 'Do not resterilize', value: 'Do not resterilize' })
    if (fam.singleUse) strip.push({ id: 'doNotReuse', sym: 'DO_NOT_REUSE', label: 'Single use', value: 'Do not re-use' })
    if (level === 'pouch' && fam.sterile !== 'NONE') {
      strip.push({ id: 'damagedPkg', sym: 'DAMAGED_PKG', label: 'Damaged package', value: 'Do not use if package is damaged' })
      strip.push({ id: 'sterileBarrier', sym: 'SINGLE_BARRIER', label: 'Sterile barrier', value: 'Single sterile barrier system' })
    }
    strip.push({ id: 'ifu', sym: 'EIFU', label: 'Instructions for use', value: `${fam.ifuRev} · ${fam.eifuUrl}` })
    if (level === 'carton' && fam.storageMaxC) {
      strip.push({ id: 'storage', sym: 'TEMP_UPPER', label: 'Storage', value: `≤ ${fam.storageMaxC} °C` })
      if (fam.keepDry) strip.push({ id: 'keepDry', sym: 'KEEP_DRY', label: 'Keep dry', value: 'Keep dry' })
      if (fam.keepFromSunlight) strip.push({ id: 'sunlight', sym: 'SUNLIGHT', label: 'Keep away from sunlight', value: 'Keep away from sunlight' })
    }
    if (level === 'carton' && fam.mr === 'conditional' && has('mr')) strip.push({ id: 'mr', sym: 'MR_COND', label: 'MR safety', value: 'MR Conditional' })
    if (has('md')) strip.push({ id: 'md', sym: 'MD', label: 'Medical device', value: 'Medical device' })
  }
  const symY = 172
  const symSize = level === 'pouch' ? 24 : 26
  strip.forEach((s, i) => add(s.id, s.label, s.value, [12 + i * (symSize + 4), symY, symSize, symSize], s.sym))

  // ---- UDI block ----
  const udiX = W - 132
  if (has('udi') || level === 'shipper' || market === 'UK') { // UK: company standard until UK UDI rules apply
    add('udi', level === 'shipper' ? 'GS1 case code (package DI)' : 'UDI carrier (GS1 DataMatrix + HRI)', udiText, [udiX, 26, 120, 120])
    if (level !== 'shipper') add('udiSym', 'UDI symbol', 'UDI', [udiX - 30, 30, 26, 26], 'UDI')
  }

  // ---- marks ----
  if (has('ce')) add('ce', 'CE marking', 'CE 9999', [W - 64, symY - 2, 52, 30])
  if (has('rx')) add('rx', 'Prescription device', 'Rx only', [W - 74, symY + 2, 62, 22])

  // ---- parties ----
  let py = 206
  const party = (id: ElementId, sym: string | undefined, label: string, value: string) => { add(id, label, value, [12, py, W - 24, 13], sym); py += 15 }
  if (has('mfr') || level !== 'shipper') party('mfr', 'MANUFACTURER', 'Manufacturer', `${COMPANY.name}, ${COMPANY.address}`)
  if (level === 'carton' || level === 'pouch') {
    if (has('authRep')) party('authRep', world.authRepSymbol, 'EU authorised representative', `${COMPANY.euRep.name}, ${COMPANY.euRep.address}`)
    if (has('importer')) party('importer', 'IMPORTER', 'Importer', `${COMPANY.euRep.name}, ${COMPANY.euRep.address}`)
    if (has('medicinal')) party('medicinal', undefined, 'Medicinal substance', PHRASES.medicinal.text.en)
    if (has('chRep')) party('chRep', 'CH_REP', 'Swiss authorised representative', `${COMPANY.chRep.name}, ${COMPANY.chRep.address}`)
    if (has('ukrp')) party('ukrp', undefined, 'UK Responsible Person', `UKRP: ${COMPANY.ukrp.name}, ${COMPANY.ukrp.address}`)
    if (has('jpMah')) party('jpMah', undefined, 'Marketing authorisation holder (JP)', `製造販売業者: ${COMPANY.jpMah.name} ${COMPANY.jpMah.address}`)
    if (has('auSponsor')) party('auSponsor', undefined, 'Australian sponsor', `Sponsor: ${COMPANY.auSponsor.name}, ${COMPANY.auSponsor.address}`)
    if (has('cnAgent')) party('cnAgent', undefined, 'Agent (CN)', `代理人: ${COMPANY.cnAgent.name} ${COMPANY.cnAgent.address}`)
    if (has('cnRegNo')) party('cnRegNo', undefined, 'NMPA registration certificate no.', '注册证编号: 国械注进20263130457 (demo)')
    if (has('saRep')) party('saRep', undefined, 'Saudi authorised representative', `AR: ${COMPANY.saRep.name}, ${COMPANY.saRep.address}`)
  }

  // ---- language panel (auto-layout: tries 1 column, then 2, picks largest legible font) ----
  const langLines: LangLine[] = []
  let langCols = 1, langFont = 0, layoutNote: string | undefined
  if (has('langPanel')) {
    const langs = MARKETS[market].langs
    for (const lg of langs) {
      const desc = PHRASES[fam.descKey].text[lg] ?? descEn
      const legacy = world.legacyStaticText ? LEGACY_TM_OVERRIDES[`store.${lg}`] : undefined
      const store = fam.storageMaxC ? (legacy ?? fill(PHRASES.store.text[lg] ?? PHRASES.store.text.en, { t: fam.storageMaxC })) : undefined
      langLines.push({ lang: lg, text: desc, store, storeSource: legacy ? 'legacy-static' : 'phrase' })
    }
    const panelW = W - 24
    const maxH = langs.length > 3 ? 170 : 60
    for (const cols of [1, 2]) {
      const colW = (panelW - (cols - 1) * 10) / cols
      const rows = Math.ceil(langLines.length / cols)
      let f = 9
      while (f >= MIN_FONT_PX) {
        const lineH = f * 1.25
        const fits = rows * lineH <= maxH && langLines.every(l => textWidth(`${l.lang.toUpperCase()} ${l.text} · ${l.store ?? ''}`, f) <= colW)
        if (fits) break
        f -= 0.2
      }
      if (f >= MIN_FONT_PX) { langCols = cols; langFont = Math.round(f * 10) / 10; break }
      langCols = cols; langFont = Math.round(f * 10) / 10
    }
    if (langCols === 2) layoutNote = `Layout solver: 1 column failed min font ${MIN_FONT_PX}px → 2 columns at ${langFont}px`
    const rows = Math.ceil(langLines.length / langCols)
    const panelH = rows * langFont * 1.25 + 18
    add('langPanel', `Language panel (${langs.length} languages)`, langs.map(l => LANG_NAMES[l]).join(', '), [12, py + 4, panelW, panelH])
    py += panelH + 6
  }

  const h = Math.max(L.h, py + 8)
  return {
    key: `${sku.ref}|${market}|${level}|${world.rev}`, sku, fam, market, level, rev: world.rev, w: W, h,
    elements: els, udi: { ...udi, text: udiText, bcid: level === 'shipper' ? 'gs1-128' : 'gs1datamatrix' },
    langLines, langCols, langFont, layoutNote, expiryShown: shownExp, expiryDerived: derivedExp,
  }
}

// ---------------- SVG rendering ----------------
const bcCache = new Map<string, string>()
export function barcodeSvg(text: string, bcid: string): string {
  const k = bcid + text
  if (!bcCache.has(k)) {
    try {
      const opts: Record<string, unknown> = bcid === 'gs1-128' ? { bcid, text, height: 9, includetext: false } : { bcid, text, scale: 2 }
      bcCache.set(k, bwipjs.toSVG(opts as never))
    } catch (e) {
      bcCache.set(k, `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#fdd"/><text x="20" y="22" font-size="5" text-anchor="middle">GS1 lint: ${(e as Error).message.slice(0, 30)}</text></svg>`)
    }
  }
  return bcCache.get(k)!
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function nestSvg(inner: string, x: number, y: number, w: number, h: number) {
  const vb = inner.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 40 40'
  const body = inner.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${body}</svg>`
}

export function renderSvg(m: LabelModel, opts: { highlight?: string[]; tamper?: boolean; dx?: number; dy?: number } = {}): string {
  const out: string[] = []
  const hl = new Set(opts.highlight || [])
  const F = 'font-family="Arial,Helvetica,\'Noto Sans\',\'Noto Sans JP\',\'Noto Sans SC\',\'Noto Naskh Arabic\',sans-serif"'
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.w} ${m.h}" width="${m.w}" height="${m.h}" ${F}>`)
  out.push(`<rect x="0" y="0" width="${m.w}" height="${m.h}" fill="#fff"/>`)
  out.push(`<g transform="translate(${opts.dx ?? 0},${opts.dy ?? 0})">`)
  out.push(`<rect x="2" y="2" width="${m.w - 4}" height="${m.h - 4}" fill="none" stroke="#c8ced6" stroke-width="1" stroke-dasharray="4 3"/>`)
  for (const e of m.elements) {
    const [x, y, w, h] = e.bbox
    out.push(`<g data-el="${e.id}" class="lt-el">`)
    out.push(`<rect class="lt-hit" x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="${hl.has(e.id) ? 'rgba(54,197,176,.22)' : 'transparent'}" stroke="${hl.has(e.id) ? '#1b9e8a' : 'none'}" rx="3"/>`)
    let value = e.value
    if (opts.tamper && e.id === 'ref') value = value.replace('30018', '30013')
    switch (e.id) {
      case 'name': out.push(`<text x="${x}" y="${y + 15}" font-size="17" font-weight="700" fill="#0b2a4a">${esc(value)}</text>`); break
      case 'desc': out.push(`<text x="${x}" y="${y + 9}" font-size="9" fill="#222">${esc(value)}</text>`); break
      case 'size': out.push(`<text x="${x}" y="${y + 9}" font-size="9.5" font-weight="700" fill="#222">${esc(value)}</text>`); break
      case 'rev': out.push(`<text x="${x + w}" y="${y + 8}" font-size="6.5" text-anchor="end" fill="#667">${esc(value)}</text>`); break
      case 'ref': case 'lot': case 'useBy': case 'mfgDate':
        out.push(nestSvg(`<svg viewBox="0 0 40 40">${SYMBOLS[e.symbol!].svg}</svg>`, x, y, 22, 22))
        out.push(`<text x="${x + 28}" y="${y + 15}" font-size="11" font-weight="700" fill="#111">${esc(value)}</text>`); break
      case 'qty': out.push(`<text x="${x}" y="${y + 10}" font-size="10" font-weight="700">QTY ${esc(value)}</text>`); break
      case 'udi': {
        const bc = barcodeSvg(m.udi!.text, m.udi!.bcid)
        if (m.udi!.bcid === 'gs1-128') {
          out.push(nestSvg(bc, x - 120, y + 2, 240, 60))
          out.push(`<text x="${x}" y="${y + 74}" font-size="7.5" text-anchor="middle" fill="#111">${esc(value)}</text>`)
        } else {
          out.push(nestSvg(bc, x + 22, y, 76, 76))
          const parts = value.match(/\(\d+\)[^(]*/g) || []
          parts.forEach((p, i) => out.push(`<text x="${x + 60}" y="${y + 90 + i * 9}" font-size="7.6" text-anchor="middle" font-family="'Courier New',monospace" font-weight="700">${esc(p)}</text>`))
        }
        break
      }
      case 'udiSym': out.push(nestSvg(`<svg viewBox="0 0 40 40">${SYMBOLS.UDI.svg}</svg>`, x, y, w, h)); break
      case 'ce':
        out.push(`<g transform="translate(${x},${y})"><path d="M16 4 A11 11 0 1 0 16 26" fill="none" stroke="#111" stroke-width="3.4"/><path d="M33 4 A11 11 0 1 0 33 26 M24 15 H32" fill="none" stroke="#111" stroke-width="3.4"/><text x="40" y="20" font-size="9" font-weight="700">9999</text></g>`); break
      case 'rx': out.push(`<text x="${x + w}" y="${y + 15}" font-size="13" font-weight="700" text-anchor="end">Rx only</text>`); break
      case 'langPanel': {
        out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f6f8fa" stroke="#d5dbe2"/>`)
        const colW = (w - (m.langCols - 1) * 10) / m.langCols
        const rows = Math.ceil(m.langLines.length / m.langCols)
        m.langLines.forEach((l, i) => {
          const c = Math.floor(i / rows), r = i % rows
          const tx = x + 6 + c * (colW + 10), ty = y + 12 + r * m.langFont * 1.25
          const rtl = l.lang === 'ar'
          out.push(`<text x="${rtl ? tx + colW - 10 : tx}" y="${ty}" font-size="${m.langFont}" ${rtl ? 'text-anchor="end" direction="rtl"' : ''} fill="#222"><tspan font-weight="700">${l.lang.toUpperCase()}</tspan> ${esc(l.text)}${l.store ? ' · ' + esc(l.store) : ''}</text>`)
        })
        break
      }
      default:
        if (e.symbol) {
          out.push(nestSvg(`<svg viewBox="0 0 40 40">${SYMBOLS[e.symbol].svg}</svg>`, x, y, Math.min(w, h), Math.min(w, h)))
          if (w > h) out.push(`<text x="${x + h + 5}" y="${y + 10}" font-size="7.4" fill="#111">${esc(value)}</text>`)
          if (e.id === 'storage') out.push(`<text x="${x + w / 2}" y="${y + h + 6.5}" font-size="6.4" font-weight="700" text-anchor="middle">${esc(value.replace('≤ ', ''))}</text>`)
        } else {
          out.push(`<text x="${x}" y="${y + 10}" font-size="7.4" fill="#111">${esc(value)}</text>`)
        }
    }
    out.push(`</g>`)
  }
  out.push(`</g></svg>`)
  return out.join('')
}

export function allLabelKeys() { return { markets: Object.keys(MARKETS) as MarketId[], levels: Object.keys(LEVELS) as LevelId[] } }
