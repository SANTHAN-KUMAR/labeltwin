// Requirement Graph: machine-readable, versioned, citation-linked labeling requirements.
// conf: V = verified against primary text, S = verified via secondary source.
import type { Family, LevelId, MarketId } from './products'

export type ElementId =
  | 'name' | 'desc' | 'size' | 'ref' | 'lot' | 'useBy' | 'mfgDate' | 'udi' | 'udiSym' | 'mfr' | 'authRep' | 'importer'
  | 'ce' | 'md' | 'sterile' | 'noResterilize' | 'doNotReuse' | 'damagedPkg' | 'sterileBarrier' | 'ifu' | 'storage'
  | 'keepDry' | 'sunlight' | 'mr' | 'medicinal' | 'rx' | 'chRep' | 'ukrp' | 'jpMah' | 'auSponsor' | 'cnAgent' | 'cnRegNo'
  | 'saRep' | 'langPanel' | 'qty'

export interface Ctx { market: MarketId; level: LevelId; fam: Family }

export interface Requirement {
  id: string
  jurisdiction: MarketId | 'ALL'
  source: string        // instrument
  clause: string        // exact clause
  title: string
  url: string
  conf: 'V' | 'S'
  effective: string
  applies: (c: Ctx) => boolean
  requires: ElementId[]
}

const EURLEX_MDR = 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'
const ECFR801 = 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801'
const notShipper = (c: Ctx) => c.level !== 'shipper'
const isMkt = (...m: MarketId[]) => (c: Ctx) => m.includes(c.market)

export const REQUIREMENTS: Requirement[] = [
  // ---------------- EU MDR (EU 2017/745) ----------------
  { id: 'EU-23.2a', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(a)', title: 'Name or trade name of the device', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: isMkt('EU'), requires: ['name'] },
  { id: 'EU-23.2b', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(b)', title: 'Details strictly necessary to identify the device, contents and intended purpose', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && notShipper(c), requires: ['desc', 'size'] },
  { id: 'EU-23.2c', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(c)', title: 'Name, registered trade name and address of the manufacturer', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: isMkt('EU'), requires: ['mfr'] },
  { id: 'EU-23.2d', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(d)', title: 'Authorised representative (manufacturer outside the Union)', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && notShipper(c), requires: ['authRep'] },
  { id: 'EU-23.2e', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(e)', title: 'Indication that the device contains a medicinal substance', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && !!c.fam.medicinal && notShipper(c), requires: ['medicinal'] },
  { id: 'EU-23.2g', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(g)', title: 'Lot number or serial number, preceded by LOT / SN symbol', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: isMkt('EU'), requires: ['lot'] },
  { id: 'EU-23.2h', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(h) + Art. 27(4)', title: 'UDI carrier on the label and all higher packaging levels (not shipping containers)', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && notShipper(c), requires: ['udi'] },
  { id: 'EU-23.2i', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(i)', title: 'Time limit for safe use (at least year and month; day optional)', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.fam.shelfLifeMonths > 0, requires: ['useBy'] },
  { id: 'EU-23.2k', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(k)', title: 'Special storage and/or handling conditions', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.level === 'carton' && !!c.fam.storageMaxC, requires: ['storage', 'keepDry', 'sunlight'] },
  { id: 'EU-23.2l', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(l)', title: 'Sterile state and sterilization method', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.fam.sterile !== 'NONE' && notShipper(c), requires: ['sterile'] },
  { id: 'EU-23.2n', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(n)', title: 'Single-use indication (consistent across the Union)', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.fam.singleUse && notShipper(c), requires: ['doNotReuse'] },
  { id: 'EU-23.2q', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(q)', title: 'Indication that the device is a medical device', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && notShipper(c), requires: ['md'] },
  { id: 'EU-23.2s', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.2(s)', title: 'Implantable devices: serial number or lot number', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.fam.implant, requires: ['lot'] },
  { id: 'EU-23.3', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Annex I §23.3', title: 'Sterile packaging: sterile state, method, damaged-package instruction, barrier', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.level === 'pouch' && c.fam.sterile !== 'NONE', requires: ['sterile', 'damagedPkg', 'sterileBarrier', 'noResterilize'] },
  { id: 'EU-A13', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Art. 13(3)', title: 'Importer name, registered trade name and address', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.level === 'carton', requires: ['importer'] },
  { id: 'EU-A20', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Art. 20 (CE marking + NB number)', title: 'CE marking followed by the notified body identification number', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && notShipper(c), requires: ['ce'] },
  { id: 'EU-A10-11', jurisdiction: 'EU', source: 'EU MDR 2017/745', clause: 'Art. 10(11)', title: 'Information in the official language(s) determined by each Member State', url: EURLEX_MDR, conf: 'V', effective: '2021-05-26', applies: c => c.market === 'EU' && c.level === 'carton', requires: ['langPanel'] },
  { id: 'EU-eIFU', jurisdiction: 'EU', source: 'Reg. (EU) 2021/2226 as amended by (EU) 2025/1234', clause: 'Art. 7', title: 'eIFU: indicate IFU supplied electronically + how to access it', url: 'https://eur-lex.europa.eu/eli/reg_impl/2021/2226/oj', conf: 'S', effective: '2025-07-16', applies: c => c.market === 'EU' && notShipper(c), requires: ['ifu'] },
  { id: 'ISO-15223', jurisdiction: 'ALL', source: 'EN ISO 15223-1:2021 (+A1:2025)', clause: 'Harmonised under MDR (Dec. (EU) 2022/6; 2026/1231)', title: 'Symbols conform to harmonised standard (MDR Annex I §23.1(h))', url: 'https://www.iso.org/standard/77326.html', conf: 'S', effective: '2022-01-05', applies: notShipper, requires: [] },
  // ---------------- US FDA ----------------
  { id: 'US-801.1', jurisdiction: 'US', source: '21 CFR 801', clause: '§801.1', title: 'Name and place of business of manufacturer, packer or distributor', url: ECFR801, conf: 'V', effective: '1976-05-28', applies: isMkt('US'), requires: ['mfr'] },
  { id: 'US-801.109', jurisdiction: 'US', source: '21 CFR 801', clause: '§801.109(b)(1)', title: '"Rx only" (or ℞ only) for prescription devices', url: ECFR801, conf: 'V', effective: '1976-05-28', applies: c => c.market === 'US' && notShipper(c), requires: ['rx'] },
  { id: 'US-801.18', jurisdiction: 'US', source: '21 CFR 801', clause: '§801.18', title: 'Dates on labels in YYYY-MM-DD format', url: ECFR801, conf: 'V', effective: '2014-09-24', applies: isMkt('US'), requires: ['useBy'] },
  { id: 'US-801.20', jurisdiction: 'US', source: '21 CFR 801', clause: '§801.20 + §801.40', title: 'UDI on label and every device package, in plain text and AIDC', url: ECFR801, conf: 'V', effective: '2014-09-24', applies: c => c.market === 'US' && notShipper(c), requires: ['udi'] },
  { id: 'US-801.15', jurisdiction: 'US', source: '21 CFR 801', clause: '§801.15(c)(1)(i)(D)', title: 'Stand-alone symbols from a recognized standard + symbols glossary', url: ECFR801, conf: 'V', effective: '2016-09-13', applies: c => c.market === 'US' && notShipper(c), requires: ['ifu'] },
  { id: 'US-MR', jurisdiction: 'US', source: 'FDA guidance (MR environment, 2023) + ASTM F2503', clause: 'MR safety labeling', title: 'MR Conditional marking for implants tested in MR', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/testing-and-labeling-medical-devices-safety-magnetic-resonance-mr-environment', conf: 'S', effective: '2023-10-10', applies: c => (c.market === 'US' || c.market === 'EU') && c.fam.mr === 'conditional' && c.level === 'carton', requires: ['mr'] },
  // ---------------- Other markets ----------------
  { id: 'UK-RP', jurisdiction: 'UK', source: 'UK MDR 2002 (as amended)', clause: 'UK Responsible Person', title: 'UK Responsible Person name and address', url: 'https://www.gov.uk/guidance/regulating-medical-devices-in-the-uk', conf: 'S', effective: '2021-01-01', applies: c => c.market === 'UK' && notShipper(c), requires: ['ukrp'] },
  { id: 'CH-MedDO', jurisdiction: 'CH', source: 'MedDO (SR 812.213)', clause: 'Art. 16 + Art. 51', title: 'Swiss authorised representative + DE/FR/IT', url: 'https://www.fedlex.admin.ch/eli/cc/2020/552/en', conf: 'S', effective: '2021-05-26', applies: c => c.market === 'CH' && notShipper(c), requires: ['chRep', 'langPanel'] },
  { id: 'CH-UDI', jurisdiction: 'CH', source: 'MedDO (SR 812.213)', clause: 'Art. 17 + swissdamed', title: 'UDI carrier on label and higher packaging levels', url: 'https://www.fedlex.admin.ch/eli/cc/2020/552/en', conf: 'S', effective: '2021-05-26', applies: c => c.market === 'CH' && notShipper(c), requires: ['udi'] },
  { id: 'JP-PMD', jurisdiction: 'JP', source: 'PMD Act', clause: 'Art. 63', title: 'MAH name/address, product name, lot on container (Japanese)', url: 'https://www.pmda.go.jp/english/', conf: 'S', effective: '2021-08-01', applies: c => c.market === 'JP' && notShipper(c), requires: ['jpMah', 'langPanel'] },
  { id: 'JP-GS1', jurisdiction: 'JP', source: 'MHLW notice (GS1 barcode)', clause: 'Mandatory GS1 barcode', title: 'GS1 barcode on device labels', url: 'https://www.mhlw.go.jp/', conf: 'S', effective: '2022-12-01', applies: c => c.market === 'JP' && notShipper(c), requires: ['udi'] },
  { id: 'CN-6', jurisdiction: 'CN', source: 'NMPA Order No. 6 (2014)', clause: 'Art. 13', title: 'Registrant, registration certificate number, agent (Chinese)', url: 'https://www.nmpa.gov.cn/', conf: 'S', effective: '2014-10-01', applies: c => c.market === 'CN' && notShipper(c), requires: ['cnAgent', 'cnRegNo', 'langPanel'] },
  { id: 'CN-UDI', jurisdiction: 'CN', source: 'NMPA UDI rules', clause: 'Class III phase', title: 'UDI carrier on Class III device labels', url: 'https://www.nmpa.gov.cn/', conf: 'S', effective: '2021-01-01', applies: c => c.market === 'CN' && notShipper(c), requires: ['udi'] },
  { id: 'SA-UDI', jurisdiction: 'SA', source: 'SFDA MDS-REQ 7', clause: 'UDI requirements', title: 'UDI carrier on device labels (Saudi-DI)', url: 'https://www.sfda.gov.sa/', conf: 'S', effective: '2022-05-24', applies: c => c.market === 'SA' && c.level !== 'shipper', requires: ['udi'] },
  { id: 'AU-EP13', jurisdiction: 'AU', source: 'TG (Medical Devices) Regs 2002 Sch 1', clause: 'EP 13.3', title: 'Australian sponsor name and address', url: 'https://www.tga.gov.au/', conf: 'S', effective: '2002-10-04', applies: c => c.market === 'AU' && notShipper(c), requires: ['auSponsor'] },
  { id: 'AU-UDI', jurisdiction: 'AU', source: 'TGA UDI framework (F2025L00414)', clause: 'Class III / IIb from 2026-07-01', title: 'UDI on labels of Class III and IIb devices', url: 'https://www.tga.gov.au/', conf: 'S', effective: '2026-07-01', applies: c => c.market === 'AU' && notShipper(c) && ['III', 'IIb'].includes(c.fam.classEU), requires: ['udi'] },
  { id: 'SA-MDS1', jurisdiction: 'SA', source: 'SFDA MDS-REQ 1', clause: 'Labelling', title: 'Arabic (and/or English) labelling; Saudi AR', url: 'https://www.sfda.gov.sa/', conf: 'S', effective: '2021-01-01', applies: c => c.market === 'SA' && notShipper(c), requires: ['saRep', 'langPanel'] },
  // ---------------- Common ----------------
  { id: 'ALL-QTY', jurisdiction: 'ALL', source: 'ISO 20417:2026', clause: 'Information to be supplied: quantity / contents', title: 'Contents of higher-level package', url: 'https://www.iso.org/standard/88714.html', conf: 'S', effective: '2026-03-17', applies: c => c.level === 'shipper', requires: ['qty', 'ref', 'lot'] },
]

export function applicable(c: Ctx) { return REQUIREMENTS.filter(r => (r.jurisdiction === 'ALL' || r.jurisdiction === c.market) && r.applies(c)) }
