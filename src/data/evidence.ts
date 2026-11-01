// Evidence base computed from openFDA device recall data (dataset last_updated 2026-10-29).
// Query: root_cause_description:labeling OR "expiration date", event_date_initiated 2023-01-01..2026-10-31.
// 480 product records -> 218 unique recall events, each read and classified by preventive control.

export const RECALL_META = {
  source: 'openFDA /device/recall.json',
  lastUpdated: '2026-10-29',
  records: 480,
  events: 218,
  longRun: { period: '2003-01 → 2026-10', total: 59347, labeling: 3516, pctAll: 5.9, pctAttributed: 8.2 },
  topCauses2324: [{ cause: 'Labeling Change Control', n: 104 }, { cause: 'Labeling design', n: 99 }],
}

export const RECALL_CLASSES = [
  { id: 'DATE', label: 'Wrong / inconsistent dates', n: 37, control: 'Expiry derived (mfg + shelf life) · ISO 8601 · cross-level', type: 'auto' },
  { id: 'UDI_ID', label: 'UDI, GTIN, lot, REF, manufacturer', n: 15, control: 'UDI triangle + master-data binding', type: 'auto' },
  { id: 'MASTER_DATA', label: 'Attribute contradicts product master', n: 25, control: 'Fields compiled from PLM/ERP', type: 'auto' },
  { id: 'CLAIM', label: 'False material / sterility claim', n: 10, control: 'Claims bound to BOM & process', type: 'auto' },
  { id: 'CONSISTENCY', label: 'Inner/outer/IFU mismatch, wrong revision', n: 9, control: 'Cross-level checks · LBOM revision binding', type: 'auto' },
  { id: 'REGULATORY', label: 'Missing required element / uncleared claim', n: 16, control: 'Requirement Graph completeness + RIM status', type: 'auto' },
  { id: 'PACKING_MIXUP', label: 'Mix-up during packaging', n: 38, control: 'Line-side vision: label + contents vs LBOM before seal', type: 'line' },
  { id: 'CONTENT_JUDGMENT', label: 'IFU content needs expert judgment', n: 58, control: 'Expert-owned; impact engine propagates the fix', type: 'human' },
  { id: 'UNCLEAR', label: 'Insufficient information', n: 10, control: '—', type: 'unclear' },
] as const

export const RECALL_EXAMPLES = [
  { firm: 'Medical Action Industries', date: '2026-07-09', cls: 'DATE', text: 'Internal data-entry error: kit lot labeled with expiry 2027-03-31 instead of 2027-02-28.' },
  { firm: 'Trackx Technology', date: '2024-09-03', cls: 'DATE', text: 'Contract manufacturer entered the manufacturing date as the expiration date.' },
  { firm: 'Home Health US', date: '2025-07-25', cls: 'UDI_ID', text: 'Incorrect / missing UDI codes on lancets.' },
  { firm: 'Avanos Medical', date: '2023-10-13', cls: 'CLAIM', text: 'Labeled as DEHP-free; product contains DEHP.' },
  { firm: 'Access Vascular', date: '2023-08-31', cls: 'CONSISTENCY', text: 'Kits shipped with an outdated IFU revision missing warnings.' },
  { firm: 'Zimmer Biomet', date: '2025-09-26', cls: 'PACKING_MIXUP', text: 'Commingle: outer label size differs from insert inside.' },
]

// Modelled value stream for one product change: 30 labels x 20 languages x 3 packaging levels (working days, elapsed).
export const VSM = [
  { step: 'Change intake & product understanding', before: 3, after: 0.3, how: 'Change Copilot + Product Master Graph' },
  { step: 'Market & regulatory requirement assessment', before: 5, after: 0.3, how: 'Requirement Graph query' },
  { step: 'Gap & impact identification', before: 4, after: 0.05, how: 'Impact Engine traversal (100% enumeration)' },
  { step: 'Content development & translation', before: 12, after: 6, how: 'Phrase-library reuse; LSP only for NEW phrases' },
  { step: 'Redline / artwork modification', before: 6, after: 0.2, how: 'Label Compiler + semantic redline' },
  { step: 'Stakeholder review cycles', before: 8, after: 3, how: 'Risk-routed, parallel, diff-only review' },
  { step: 'RA / QA approval', before: 4, after: 2, how: 'Part 11 e-signature, parallel' },
  { step: 'Change order & configuration control', before: 3, after: 0.2, how: 'Auto-generated LCO + LBOM baseline' },
  { step: 'Final quality check (proof)', before: 3, after: 0.3, how: 'Verification Suite + CV proof compare' },
  { step: 'Release & production implementation', before: 4, after: 2.5, how: 'Release package to LMS; guided FAI' },
]
export const VSM_TOTAL = { before: VSM.reduce((s, x) => s + x.before, 0), after: Math.round(VSM.reduce((s, x) => s + x.after, 0) * 10) / 10 }
