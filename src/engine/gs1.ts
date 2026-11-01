// GS1 Application Identifier handling for UDI (GS1 General Specifications).
// Real logic: check digits, AI syntax, YYMMDD date semantics, element-string building and parsing.

export type AI = '01' | '11' | '17' | '10' | '21'

export const AI_SPEC: Record<AI, { title: string; fixed?: number; max?: number; numeric: boolean; udiPart: 'DI' | 'PI' }> = {
  '01': { title: 'GTIN (UDI-DI)', fixed: 14, numeric: true, udiPart: 'DI' },
  '11': { title: 'Production date (YYMMDD)', fixed: 6, numeric: true, udiPart: 'PI' },
  '17': { title: 'Expiration date (YYMMDD)', fixed: 6, numeric: true, udiPart: 'PI' },
  '10': { title: 'Batch / lot', max: 20, numeric: false, udiPart: 'PI' },
  '21': { title: 'Serial number', max: 20, numeric: false, udiPart: 'PI' },
}

// GS1 AI encodable character set 82 (subset used for alphanumeric AIs)
const CSET82 = /^[!"%&'()*+,\-./0-9:;<=>?A-Z_a-z]*$/

export function gs1CheckDigit(body: string): string {
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(body.length - 1 - i) - 48
    sum += d * (i % 2 === 0 ? 3 : 1)
  }
  return String((10 - (sum % 10)) % 10)
}

export function makeGtin14(indicator: number, gtin13Body12: string): string {
  const body = String(indicator) + gtin13Body12
  return body + gs1CheckDigit(body)
}

export function isValidGtin14(g: string): boolean {
  return /^\d{14}$/.test(g) && gs1CheckDigit(g.slice(0, 13)) === g[13]
}

/** ISO 8601 (YYYY-MM-DD) -> GS1 YYMMDD */
export function isoToYYMMDD(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y.slice(2) + m + d
}

/** GS1 YYMMDD -> ISO, using the GS1 century rule (sliding window, GS1 Gen Specs 7.12) */
export function yymmddToIso(v: string, ref = new Date('2026-11-01')): string {
  const yy = Number(v.slice(0, 2))
  const curYY = ref.getUTCFullYear() % 100
  const curCentury = ref.getUTCFullYear() - curYY
  const diff = yy - curYY
  let century = curCentury
  if (diff >= 51 && diff <= 99) century -= 100
  else if (diff >= -99 && diff <= -50) century += 100
  const dd = v.slice(4, 6) === '00' ? lastDay(century + yy, Number(v.slice(2, 4))) : v.slice(4, 6)
  return `${century + yy}-${v.slice(2, 4)}-${dd}`
}

function lastDay(y: number, m: number) {
  return String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')
}

export function isValidIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const d = new Date(iso + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

export function addMonthsIso(iso: string, months: number): string {
  // Expiry = manufacture date + validated shelf life, minus one day (end of the shelf-life period)
  const d = new Date(iso + 'T00:00:00Z')
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const dim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, dim))
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export interface UdiData { gtin: string; mfg?: string; exp?: string; lot?: string; serial?: string }

/** Human-readable interpretation in GS1 bracket notation, AIs in the order recommended for UDI. */
export function buildElementString(u: UdiData): string {
  let s = `(01)${u.gtin}`
  if (u.mfg) s += `(11)${isoToYYMMDD(u.mfg)}`
  if (u.exp) s += `(17)${isoToYYMMDD(u.exp)}`
  if (u.lot) s += `(10)${u.lot}`
  if (u.serial) s += `(21)${u.serial}`
  return s
}

export interface ParsedAI { ai: string; value: string }

export function parseBracketed(s: string): ParsedAI[] {
  const out: ParsedAI[] = []
  const re = /\((\d{2,4})\)([^(]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) out.push({ ai: m[1], value: m[2] })
  return out
}

export interface Gs1Issue { ai?: string; severity: 'error' | 'warn'; msg: string }

/** Syntax + semantic validation of a GS1 element string (bracketed HRI form). */
export function validateElementString(s: string): Gs1Issue[] {
  const issues: Gs1Issue[] = []
  const parts = parseBracketed(s)
  if (!parts.length) return [{ severity: 'error', msg: 'No GS1 Application Identifiers found' }]
  if (parts[0].ai !== '01') issues.push({ severity: 'error', msg: 'UDI-DI AI (01) must be first' })
  const seen = new Set<string>()
  for (const p of parts) {
    const spec = AI_SPEC[p.ai as AI]
    if (!spec) { issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) not allowed in this UDI profile` }); continue }
    if (seen.has(p.ai)) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) repeated` })
    seen.add(p.ai)
    if (spec.fixed && p.value.length !== spec.fixed) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) must be exactly ${spec.fixed} digits` })
    if (spec.max && p.value.length > spec.max) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) longer than ${spec.max}` })
    if (spec.numeric && !/^\d+$/.test(p.value)) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) must be numeric` })
    if (!spec.numeric && !CSET82.test(p.value)) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) contains characters outside GS1 CSET 82` })
    if (p.ai === '01' && p.value.length === 14 && !isValidGtin14(p.value)) issues.push({ ai: '01', severity: 'error', msg: 'GTIN check digit invalid' })
    if ((p.ai === '11' || p.ai === '17') && p.value.length === 6) {
      const mm = Number(p.value.slice(2, 4)), dd = Number(p.value.slice(4, 6))
      if (mm < 1 || mm > 12 || dd > 31) issues.push({ ai: p.ai, severity: 'error', msg: `AI (${p.ai}) is not a valid YYMMDD date` })
    }
  }
  const mfg = parts.find(p => p.ai === '11')?.value
  const exp = parts.find(p => p.ai === '17')?.value
  if (mfg && exp && yymmddToIso(exp) <= yymmddToIso(mfg)) issues.push({ ai: '17', severity: 'error', msg: 'Expiry (17) is not after production date (11)' })
  if (!parts.some(p => p.ai === '10' || p.ai === '21')) issues.push({ severity: 'warn', msg: 'No lot (10) or serial (21): UDI-PI incomplete for an implant' })
  return issues
}

export function aiMap(parts: ParsedAI[]): Record<string, string> {
  return Object.fromEntries(parts.map(p => [p.ai, p.value]))
}
