// Versioned symbol library. Glyphs are simplified illustrative renderings (40x40 units).
// Production uses the licensed ISO 7000 / ISO 15223-1 artwork, validated per symbol version.

export interface SymbolDef {
  id: string
  ref: string            // ISO 15223-1:2021 reference number (or other standard)
  standard: string
  title: string
  validFrom?: string
  validUntil?: string    // e.g. end of presumption of conformity for a superseded version
  supersededBy?: string
  fdaGlossary: boolean   // needs symbols glossary under 21 CFR 801.15(c)(1)(i)(D)
  note?: string
  svg: string            // inner markup in a 40x40 box
}

const S = 'stroke="#111" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round"'
const T = (t: string, size = 11, y = 24.5, w = 700) =>
  `<text x="20" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${w}" text-anchor="middle" fill="#111">${t}</text>`
const box = (t: string, size = 11) => `<rect x="2" y="9" width="36" height="22" ${S}/>` + T(t, size)

const factory = (filled: boolean) =>
  `<path d="M4 34 V18 L12 24 V18 L20 24 V18 L28 24 V8 H34 V34 Z" fill="${filled ? '#111' : 'none'}" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>`

export const SYMBOLS: Record<string, SymbolDef> = {
  MANUFACTURER: { id: 'MANUFACTURER', ref: '5.1.1', standard: 'ISO 15223-1:2021', title: 'Manufacturer', fdaGlossary: true, svg: factory(true) },
  DATE_MFG: { id: 'DATE_MFG', ref: '5.1.3', standard: 'ISO 15223-1:2021', title: 'Date of manufacture', fdaGlossary: true, svg: factory(false) },
  USE_BY: { id: 'USE_BY', ref: '5.1.4', standard: 'ISO 15223-1:2021', title: 'Use-by date', fdaGlossary: true,
    svg: `<path d="M11 5 H29 M11 35 H29 M13 5 C13 15 27 17 27 20 C27 23 13 25 13 35 M27 5 C27 15 13 17 13 20 C13 23 27 25 27 35" ${S}/><path d="M15 33 C16 29 24 29 25 33 Z" fill="#111"/>` },
  LOT: { id: 'LOT', ref: '5.1.5', standard: 'ISO 15223-1:2021', title: 'Batch code', fdaGlossary: true, svg: box('LOT') },
  REF: { id: 'REF', ref: '5.1.6', standard: 'ISO 15223-1:2021', title: 'Catalogue number', fdaGlossary: true, svg: box('REF') },
  SN: { id: 'SN', ref: '5.1.7', standard: 'ISO 15223-1:2021', title: 'Serial number', fdaGlossary: true, svg: box('SN') },
  EC_REP: { id: 'EC_REP', ref: '5.1.2', standard: 'ISO 15223-1:2021', title: 'Authorized representative in the European Community', fdaGlossary: false,
    validUntil: '2031-06-15', supersededBy: 'EU_REP', note: 'Superseded by ISO 15223-1:2021/Amd 1:2025 (region-neutral symbol). Under MDR the un-amended standard keeps presumption of conformity until 2031-06-15 (Impl. Dec. (EU) 2026/1231 Art. 2).',
    svg: `<rect x="1" y="9" width="38" height="22" ${S}/><line x1="15" y1="9" x2="15" y2="31" ${S}/>` + `<text x="8" y="24" font-family="Arial" font-size="9" font-weight="700" text-anchor="middle">EC</text><text x="27" y="24" font-family="Arial" font-size="9" font-weight="700" text-anchor="middle">REP</text>` },
  EU_REP: { id: 'EU_REP', ref: '5.1.2', standard: 'ISO 15223-1:2021/Amd 1:2025', title: 'Authorized representative (region-neutral symbol)', fdaGlossary: false, validFrom: '2025-03-01',
    note: 'Amd 1:2025 makes the symbol not country or region specific; harmonised under MDR by Implementing Decision (EU) 2026/1231.',
    svg: `<rect x="1" y="9" width="38" height="22" ${S}/>` + T('REP', 11) },
  CH_REP: { id: 'CH_REP', ref: '5.1.2', standard: 'ISO 15223-1:2021/Amd 1:2025', title: 'Swiss authorised representative (CH-REP, Swissmedic)', fdaGlossary: false,
    svg: `<rect x="1" y="9" width="38" height="22" ${S}/><line x1="15" y1="9" x2="15" y2="31" ${S}/>` + `<text x="8" y="24" font-family="Arial" font-size="9" font-weight="700" text-anchor="middle">CH</text><text x="27" y="24" font-family="Arial" font-size="9" font-weight="700" text-anchor="middle">REP</text>` },
  IMPORTER: { id: 'IMPORTER', ref: '5.1.8', standard: 'ISO 15223-1:2021', title: 'Importer', fdaGlossary: false,
    svg: `<path d="M5 34 V17 L20 7 L35 17 V34 Z" ${S}/><path d="M11 25 H27 M22 20 L27 25 L22 30" ${S}/>` },
  STERILE_EO: { id: 'STERILE_EO', ref: '5.2.3', standard: 'ISO 15223-1:2021', title: 'Sterilized using ethylene oxide', fdaGlossary: true,
    svg: `<rect x="1" y="12" width="38" height="16" ${S}/><line x1="27" y1="12" x2="27" y2="28" ${S}/><text x="3.5" y="22.6" font-family="Arial" font-size="6.4" font-weight="700" textLength="21.5" lengthAdjust="spacingAndGlyphs">STERILE</text><text x="33" y="23" font-family="Arial" font-size="6.5" font-weight="700" text-anchor="middle">EO</text>` },
  STERILE_R: { id: 'STERILE_R', ref: '5.2.4', standard: 'ISO 15223-1:2021', title: 'Sterilized using irradiation', fdaGlossary: true,
    svg: `<rect x="1" y="12" width="38" height="16" ${S}/><line x1="27" y1="12" x2="27" y2="28" ${S}/><text x="3.5" y="22.6" font-family="Arial" font-size="6.4" font-weight="700" textLength="21.5" lengthAdjust="spacingAndGlyphs">STERILE</text><text x="33" y="23" font-family="Arial" font-size="8" font-weight="700" text-anchor="middle">R</text>` },
  NO_RESTERILIZE: { id: 'NO_RESTERILIZE', ref: '5.2.6', standard: 'ISO 15223-1:2021', title: 'Do not resterilize', fdaGlossary: true,
    svg: `<rect x="1" y="12" width="38" height="16" ${S}/><text x="20" y="22.6" font-family="Arial" font-size="6.6" font-weight="700" text-anchor="middle" textLength="30" lengthAdjust="spacingAndGlyphs">STERILE</text><line x1="4" y1="31" x2="36" y2="9" ${S}/><line x1="4" y1="9" x2="36" y2="31" ${S}/>` },
  DAMAGED_PKG: { id: 'DAMAGED_PKG', ref: '5.2.8', standard: 'ISO 15223-1:2021', title: 'Do not use if package is damaged and consult instructions for use', fdaGlossary: true,
    svg: `<path d="M8 16 L20 10 L32 16 V30 L20 36 L8 30 Z M8 16 L20 22 L32 16 M20 22 V36" ${S}/><circle cx="20" cy="22" r="17" ${S}/><line x1="8" y1="34" x2="32" y2="10" ${S}/>` },
  SINGLE_BARRIER: { id: 'SINGLE_BARRIER', ref: '5.2.11', standard: 'ISO 15223-1:2021', title: 'Single sterile barrier system', fdaGlossary: true,
    svg: `<circle cx="20" cy="17" r="7" ${S}/><path d="M6 31 C12 24 28 24 34 31" ${S}/>` },
  KEEP_DRY: { id: 'KEEP_DRY', ref: '5.3.4', standard: 'ISO 15223-1:2021', title: 'Keep dry', fdaGlossary: true,
    svg: `<path d="M5 19 C7 9 33 9 35 19 Z M20 19 V31 C20 35 14 35 14 31" ${S}/><path d="M9 5 l-1 3 M17 3 l-1 3 M26 3 l-1 3 M33 5 l-1 3" ${S}/>` },
  SUNLIGHT: { id: 'SUNLIGHT', ref: '5.3.2', standard: 'ISO 15223-1:2021', title: 'Keep away from sunlight', fdaGlossary: true,
    svg: `<circle cx="20" cy="26" r="6" ${S}/><path d="M20 15 V12 M11 26 H8 M32 26 H29 M13 19 L11 17 M27 19 L29 17" ${S}/><path d="M3 10 C10 2 30 2 37 10" ${S}/>` },
  TEMP_UPPER: { id: 'TEMP_UPPER', ref: '5.3.6', standard: 'ISO 15223-1:2021', title: 'Upper limit of temperature', fdaGlossary: true,
    svg: `<path d="M12 34 H16 V8 H24" ${S}/><path d="M16 8 H11" ${S}/>` },
  DO_NOT_REUSE: { id: 'DO_NOT_REUSE', ref: '5.4.2', standard: 'ISO 15223-1:2021', title: 'Do not re-use', fdaGlossary: true,
    svg: `<circle cx="20" cy="20" r="16" ${S}/>` + T('2', 17, 26.5) + `<line x1="9" y1="31" x2="31" y2="9" ${S}/>` },
  EIFU: { id: 'EIFU', ref: '5.4.3', standard: 'ISO 15223-1:2021', title: 'Consult instructions for use or consult electronic instructions for use', fdaGlossary: true,
    svg: `<path d="M4 9 H17 C19 9 20 10 20 12 V34 C20 32 19 31 17 31 H4 Z M36 9 H23 C21 9 20 10 20 12 V34 C20 32 21 31 23 31 H36 Z" ${S}/>` + `<text x="28" y="26" font-family="Georgia,serif" font-size="13" font-weight="700" text-anchor="middle">i</text>` },
  CAUTION: { id: 'CAUTION', ref: '5.4.4', standard: 'ISO 15223-1:2021', title: 'Caution', fdaGlossary: true,
    svg: `<path d="M20 4 L37 34 H3 Z" ${S}/>` + T('!', 17, 31) },
  MD: { id: 'MD', ref: '5.7.7', standard: 'ISO 15223-1:2021', title: 'Medical device', fdaGlossary: false, svg: box('MD', 13) },
  UDI: { id: 'UDI', ref: '5.7.10', standard: 'ISO 15223-1:2021', title: 'Unique device identifier', fdaGlossary: true, svg: box('UDI', 12) },
  MR_COND: { id: 'MR_COND', ref: 'Table 1, MR Conditional', standard: 'ASTM F2503-23', title: 'MR Conditional', fdaGlossary: true,
    svg: `<path d="M20 3 L37 35 H3 Z" fill="#f4c20d" stroke="#111" stroke-width="2"/>` + T('MR', 10.5, 29) },
}

export const SYMBOL_USAGE_NOTE =
  'Glyphs are simplified illustrative renderings. Production uses licensed ISO 7000 / ISO 15223-1 artwork, version-locked per symbol.'
