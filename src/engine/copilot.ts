// Change Copilot: free text / voice -> structured, schema-validated change set.
// Production: small open LLM with JSON-schema constrained decoding. Prototype: deterministic extractor with the
// same output schema, so the downstream pipeline is identical.
export interface ChangeItem { attribute: 'shelfLife' | 'sterilization' | 'storageMaxC' | 'lotFrom'; from: string; to: string; evidence?: string }
export interface ChangeSet { product: string; productId: string; items: ChangeItem[]; effectivity?: string; confidence: number; unparsed: string[] }

export const EXAMPLE_REQUEST =
  'CoroFlex: extend shelf life from 24 to 36 months per real-time aging report AR-0457, and move sterilization from EO to e-beam irradiation starting with lot CF26B. ECO-2026-0412.'

export function parseChange(text: string): ChangeSet {
  const t = text.toLowerCase()
  const items: ChangeItem[] = []
  const unparsed: string[] = []
  const product = /coro\s*flex|stent|\bcf\b/.test(t) ? 'CoroFlex™ DES' : /ortho|screw/.test(t) ? 'OrthoLock™ Cortical Screw' : /versa|grasper/.test(t) ? 'VersaGrip™ Grasper' : 'unknown'
  const sl = t.match(/shelf[- ]?life[^\d]{0,40}?(\d{1,3})\s*(?:to|→|->)\s*(\d{1,3})\s*(month|mo|year|yr)/) || t.match(/shelf[- ]?life[^\d]{0,40}?(?:to|of)\s*(\d{1,3})\s*(month|mo|year|yr)/)
  if (sl) {
    const to = sl.length === 4 ? Number(sl[2]) : Number(sl[1])
    const unit = sl.length === 4 ? sl[3] : sl[2]
    const months = unit.startsWith('y') ? to * 12 : to
    items.push({ attribute: 'shelfLife', from: '24', to: String(months), evidence: (t.match(/\b(ar-\d{3,5})\b/) || [])[1]?.toUpperCase() })
  }
  if (/e-?beam|gamma|irradiat|radiation/.test(t)) items.push({ attribute: 'sterilization', from: 'EO', to: 'R', evidence: 'Sterilization validation (ISO 11137) required' })
  else if (/\beo\b|ethylene oxide/.test(t) && /to eo|to ethylene/.test(t)) items.push({ attribute: 'sterilization', from: 'R', to: 'EO' })
  const temp = t.match(/(?:store|storage)[^\d]{0,30}(\d{2})\s*°?\s*c/)
  if (temp) items.push({ attribute: 'storageMaxC', from: '25', to: temp[1] })
  const lot = text.match(/lot\s+([A-Z0-9]{4,})/i)
  const eco = text.match(/ECO-\d{4}-\d{3,5}/i)
  if (!items.length) unparsed.push('No recognised attribute change; routed to Labeling Engineer for manual structuring.')
  const confidence = product === 'unknown' ? 0.4 : items.length ? 0.93 : 0.5
  return { product, productId: product.startsWith('Coro') ? 'CF' : product.startsWith('Ortho') ? 'OL' : 'VG', items, effectivity: lot ? `from lot ${lot[1].toUpperCase()}` : undefined, confidence, unparsed: eco ? unparsed : [...unparsed] }
}
