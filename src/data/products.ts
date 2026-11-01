// Product master (fictional). GTINs use GS1 prefix 952, which GS1 reserves for demonstrations and examples.
import { makeGtin14 } from '../engine/gs1'

export type MarketId = 'US' | 'EU' | 'UK' | 'CH' | 'JP' | 'CN' | 'AU' | 'SA'
export type LevelId = 'pouch' | 'carton' | 'shipper'
export type Sterilization = 'EO' | 'R' | 'NONE'

export interface Family {
  id: string
  name: string
  descKey: string
  classEU: string
  classUS: string
  implant: boolean
  sterile: Sterilization
  singleUse: boolean
  shelfLifeMonths: number
  storageMaxC?: number
  keepDry: boolean
  keepFromSunlight: boolean
  mr: 'conditional' | 'safe' | 'none'
  medicinal?: string
  latex: boolean
  markets: MarketId[]
  skuCount: number
  ifuRev: string
  eifuUrl: string
}

export const COMPANY = {
  name: 'Orvella Medical Inc.',
  address: '1200 Innovation Drive, Minneapolis, MN 55401, USA',
  euRep: { name: 'Orvella Medical EU B.V.', address: 'Kanaalweg 8, 3526 KL Utrecht, NL' },
  chRep: { name: 'Orvella Medical (Schweiz) AG', address: 'Baarerstrasse 40, 6300 Zug, CH' },
  ukrp: { name: 'Orvella Medical UK Ltd', address: '3 Forbury Square, Reading RG1 3EB, UK' },
  jpMah: { name: 'オルヴェラ・メディカル合同会社', address: '東京都港区芝浦3-1-1' },
  auSponsor: { name: 'Orvella Medical Pty Ltd', address: '100 Pacific Hwy, North Sydney NSW 2060, AU' },
  saRep: { name: 'Orvella Arabia LLC', address: 'King Fahd Rd, Riyadh 12271, SA' },
  cnAgent: { name: '奥维拉医疗器械（上海）有限公司', address: '上海市浦东新区张江路88号' },
  gs1Prefix: '9521234',
}

export const FAMILIES: Family[] = [
  {
    id: 'CF', name: 'CoroFlex™ DES', descKey: 'desc_cf', classEU: 'III', classUS: 'III (PMA)', implant: true, sterile: 'EO', singleUse: true,
    shelfLifeMonths: 24, storageMaxC: 25, keepDry: true, keepFromSunlight: true, mr: 'conditional', medicinal: 'sirolimus', latex: false,
    markets: ['US', 'EU', 'UK', 'CH', 'JP', 'CN', 'AU', 'SA'], skuCount: 48, ifuRev: 'IFU-CF-07 Rev G', eifuUrl: 'eifu.orvella-demo.example/cf',
  },
  {
    id: 'OL', name: 'OrthoLock™ Cortical Screw', descKey: 'desc_ol', classEU: 'IIb', classUS: 'II (510(k))', implant: true, sterile: 'R', singleUse: true,
    shelfLifeMonths: 60, keepDry: true, keepFromSunlight: false, mr: 'conditional', latex: false,
    markets: ['US', 'EU', 'UK', 'AU', 'JP'], skuCount: 120, ifuRev: 'IFU-OL-03 Rev C', eifuUrl: 'eifu.orvella-demo.example/ol',
  },
  {
    id: 'VG', name: 'VersaGrip™ Laparoscopic Grasper', descKey: 'desc_vg', classEU: 'Ir (reusable surgical)', classUS: 'I (exempt)', implant: false, sterile: 'NONE', singleUse: false,
    shelfLifeMonths: 0, keepDry: true, keepFromSunlight: false, mr: 'none', latex: false,
    markets: ['US', 'EU', 'UK', 'CH'], skuCount: 18, ifuRev: 'IFU-VG-11 Rev B', eifuUrl: 'eifu.orvella-demo.example/vg',
  },
]

export const CF_DIAMETERS = [2.25, 2.5, 2.75, 3.0, 3.5, 4.0]
export const CF_LENGTHS = [8, 12, 15, 18, 23, 28, 33, 38]

export interface Sku { ref: string; family: string; diameter: number; length: number; gtinUnit: string; gtinCase: string; caseQty: number }

export const CF_SKUS: Sku[] = CF_DIAMETERS.flatMap((d, i) =>
  CF_LENGTHS.map((l, j) => {
    const item = String(30000 + i * 100 + j).padStart(5, '0')
    const body12 = COMPANY.gs1Prefix + item // 7 + 5 = 12
    return {
      ref: `CF-${String(Math.round(d * 100)).padStart(3, '0')}${String(l).padStart(2, '0')}`,
      family: 'CF', diameter: d, length: l,
      gtinUnit: makeGtin14(0, body12), gtinCase: makeGtin14(1, body12), caseQty: 5,
    }
  }),
)

export const DEMO_SKU = CF_SKUS.find(s => s.ref === 'CF-30018')!

export const MARKETS: Record<MarketId, { name: string; flag: string; langs: string[]; regulator: string }> = {
  US: { name: 'United States', flag: '🇺🇸', langs: ['en'], regulator: 'FDA' },
  EU: { name: 'European Union', flag: '🇪🇺', langs: ['en', 'bg', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 'hr', 'hu', 'it', 'lt', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv'], regulator: 'EU MDR / Notified Body' },
  UK: { name: 'Great Britain', flag: '🇬🇧', langs: ['en'], regulator: 'MHRA' },
  CH: { name: 'Switzerland', flag: '🇨🇭', langs: ['de', 'fr', 'it'], regulator: 'Swissmedic' },
  JP: { name: 'Japan', flag: '🇯🇵', langs: ['ja'], regulator: 'MHLW / PMDA' },
  CN: { name: 'China', flag: '🇨🇳', langs: ['zh'], regulator: 'NMPA' },
  AU: { name: 'Australia', flag: '🇦🇺', langs: ['en'], regulator: 'TGA' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', langs: ['ar', 'en'], regulator: 'SFDA' },
}

export const LEVELS: Record<LevelId, { name: string; w: number; h: number; note: string }> = {
  pouch: { name: 'Pouch (sterile barrier, device label)', w: 340, h: 200, note: 'Sterile packaging: MDR Annex I §23.3' },
  carton: { name: 'Carton (unit of sale)', w: 420, h: 270, note: 'Unit of sale: full label + language panel' },
  shipper: { name: 'Shipper (5 cartons)', w: 420, h: 210, note: 'Higher-level package DI (indicator 1)' },
}

// Lots for the demo (manufacture dates are ISO 8601)
export const LOTS = {
  before: { lot: 'CF26A0391', mfg: '2026-03-02' },
  after: { lot: 'CF26B0457', mfg: '2026-11-12' },
}

// ---------------- Sources of truth (Connect layer) ----------------
export interface SourceSystem { id: string; name: string; kind: string; product: string; records: number; status: 'synced' | 'conflict'; lastSync: string }

export const SOURCES: SourceSystem[] = [
  { id: 'plm', name: 'PLM', kind: 'Windchill-class PLM', product: 'Parts, BOM, ECOs, specs', records: 18420, status: 'synced', lastSync: '2026-11-01 08:40' },
  { id: 'erp', name: 'ERP', kind: 'SAP S/4-class ERP', product: 'Material master, GTINs, batches', records: 9310, status: 'conflict', lastSync: '2026-11-01 08:41' },
  { id: 'rim', name: 'RIM', kind: 'Regulatory information mgmt', product: 'Registrations, certificates, submissions', records: 1286, status: 'conflict', lastSync: '2026-11-01 08:38' },
  { id: 'qms', name: 'QMS / Risk file', kind: 'eQMS + ISO 14971 risk file', product: 'Risk controls, CAPA, complaints', records: 4122, status: 'synced', lastSync: '2026-11-01 08:35' },
  { id: 'lms', name: 'Label archive', kind: 'Loftware / PRISYM / BarTender', product: '312 templates · 6,940 approved labels', records: 6940, status: 'synced', lastSync: '2026-11-01 08:30' },
  { id: 'tms', name: 'Translation memory', kind: 'TMS / TBX termbase', product: '28 languages · 41k segments', records: 41022, status: 'synced', lastSync: '2026-10-31 22:00' },
  { id: 'reg', name: 'UDI registries', kind: 'GUDID · EUDAMED · AusUDID · swissdamed', product: 'DI records', records: 186, status: 'conflict', lastSync: '2026-11-01 06:00' },
]

export interface Conflict { id: string; attribute: string; entity: string; values: { source: string; value: string }[]; golden: string; policy: string; resolution: string; severity: 'high' | 'medium' }

export const CONFLICTS: Conflict[] = [
  {
    id: 'C1', attribute: 'Shelf life', entity: 'CoroFlex™ DES (all 48 SKUs)', severity: 'high',
    values: [{ source: 'PLM', value: '36 months · ECO-2026-0412 (approved 2026-10-28, aging report AR-0457)' }, { source: 'ERP', value: '24 months' }, { source: 'Approved labels', value: '24 months (Rev F)' }],
    golden: 'PLM', policy: 'Data-governance rule DG-07: PLM is master for design attributes (shelf life, sterilization, materials).',
    resolution: 'Raise ERP update task and trigger label change impact analysis.',
  },
  {
    id: 'C2', attribute: 'Manufacturer postcode', entity: 'Orvella Medical Inc.', severity: 'medium',
    values: [{ source: 'RIM (registrations)', value: 'MN 55401' }, { source: 'Legacy label OCR (VG Rev A)', value: 'MN 55402' }],
    golden: 'RIM', policy: 'DG-03: legal entity data mastered in RIM (must match registrations).',
    resolution: 'Legacy VersaGrip label flagged; included in next VG revision.',
  },
  {
    id: 'C3', attribute: 'EUDAMED UDI-DI registration', entity: '3 legacy OrthoLock DIs', severity: 'high',
    values: [{ source: 'ERP', value: 'Active, shipped to EU' }, { source: 'EUDAMED', value: 'Not registered' }],
    golden: 'Regulation', policy: 'MDR Art. 29 + EUDAMED mandatory use: legacy-device UDI registration due 2026-11-28.',
    resolution: 'Registry sync task created (due in 27 days).',
  },
]

export const PROVENANCE_RECORDS: Record<string, { system: string; record: string }> = {
  name: { system: 'PLM', record: 'PART CF-30018 · attr: tradeName' },
  desc: { system: 'Phrase library', record: 'PHR-0012 desc_cf v4' },
  size: { system: 'PLM', record: 'PART CF-30018 · attr: diameter, length' },
  ref: { system: 'PLM', record: 'PART CF-30018 · attr: catalogueNo' },
  lot: { system: 'ERP / MES', record: 'Batch record (process order 4100-88231)' },
  useBy: { system: 'Compiler (derived)', record: 'mfg date (MES) + shelfLife (PLM ECO-2026-0412)' },
  mfgDate: { system: 'MES', record: 'Batch record (process order 4100-88231)' },
  udi: { system: 'ERP + GS1', record: 'GTIN (ERP material master) + PI from batch' },
  mfr: { system: 'RIM', record: 'Legal entity LE-001' },
  authRep: { system: 'RIM', record: 'EU AR mandate AR-EU-2021-04' },
  importer: { system: 'RIM', record: 'Importer IMP-EU-01' },
  sterile: { system: 'PLM', record: 'Sterilization spec SP-0091' },
  storage: { system: 'QMS risk file', record: 'Risk control RC-12 (thermal degradation of coating)' },
  mr: { system: 'PLM / DHF', record: 'MR testing report MRT-CF-02 (ASTM F2182/F2213)' },
  medicinal: { system: 'PLM BOM', record: 'BOM item API-SIR-01 sirolimus coating' },
  ifu: { system: 'DMS', record: 'IFU-CF-07 Rev G + eIFU site' },
  ce: { system: 'RIM', record: 'EU certificate (Annex IX), NB 9999 (fictional)' },
}
