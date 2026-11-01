// Regulatory intelligence feed (snapshot of real 2025-2026 events). RegWatch maps each item to Requirement Graph deltas.
export interface RegItem {
  id: string
  date: string
  source: string
  title: string
  summary: string
  url: string
  relevance: 'label-impact' | 'process-impact' | 'registry-impact' | 'no-impact'
  delta: string
  impact: { labels: number; families: string[]; markets: string[]; deadline?: string; action: string }
}

export const REG_FEED: RegItem[] = [
  {
    id: 'RW-2026-118', date: '2026-06-17', source: 'Official Journal of the EU',
    title: 'Implementing Decision (EU) 2026/1231 harmonises EN ISO 15223-1:2021/A1:2025',
    summary: 'Adds a defined term for authorised representative and modifies the EC REP symbol (5.1.2) so it is not country or region specific. Under the MDR, the un-amended standard keeps presumption of conformity until 2031-06-15 (Art. 2).',
    url: 'https://eur-lex.europa.eu/oj/direct-access.html', relevance: 'label-impact',
    delta: 'Symbol 5.1.2 → region-neutral REP version; EC REP validUntil 2031-06-15',
    impact: { labels: 372, families: ['CoroFlex', 'OrthoLock', 'VersaGrip'], markets: ['EU'], deadline: '2031-06-15', action: 'Adopt at next revision of each label (no forced relabel); CoroFlex adopts in Rev G' },
  },
  {
    id: 'RW-2026-071', date: '2026-03-17', source: 'ISO',
    title: 'ISO 20417:2026 (2nd edition) published, replaces ISO 20417:2021',
    summary: 'Information to be supplied by the manufacturer. Updated normative references, informative annexes removed, new term "applicable policy".',
    url: 'https://www.iso.org/standard/88714.html', relevance: 'process-impact',
    delta: '4 requirement nodes re-cited to ISO 20417:2026; 0 element changes',
    impact: { labels: 0, families: [], markets: ['ALL'], action: 'Update labeling SOP-LBL-002 references; gap assessment shows no label element change' },
  },
  {
    id: 'RW-2026-152', date: '2026-05-28', source: 'European Commission / EUDAMED',
    title: 'EUDAMED UDI/Device module mandatory; legacy-device registration due 2026-11-28',
    summary: 'Four EUDAMED modules mandatory from 28 May 2026; devices already on the market must be registered in the UDI/Device module.',
    url: 'https://health.ec.europa.eu/medical-devices-eudamed/overview_en', relevance: 'registry-impact',
    delta: 'Registry rule REG-EU-01 now enforced in release gate',
    impact: { labels: 0, families: ['OrthoLock'], markets: ['EU'], deadline: '2026-11-28', action: '3 legacy OrthoLock UDI-DIs not registered → registry task' },
  },
  {
    id: 'RW-2026-133', date: '2026-07-01', source: 'TGA (Australia)',
    title: 'UDI labeling mandatory for Class III and IIb devices',
    summary: 'Australian UDI framework: Class III/IIb from 1 Jul 2026, IIa 2027, I 2028.',
    url: 'https://www.tga.gov.au/', relevance: 'label-impact',
    delta: 'Requirement AU-UDI effective 2026-07-01',
    impact: { labels: 336, families: ['CoroFlex', 'OrthoLock'], markets: ['AU'], deadline: '2026-07-01', action: 'Already compliant: AU labels compiled with UDI carrier since template v3' },
  },
  {
    id: 'RW-2026-160', date: '2026-02-02', source: 'US FDA',
    title: 'QMSR (21 CFR 820, ISO 13485 by reference) in force; labeling controls now §820.45',
    summary: '§820.45(a): labeling examined for accuracy before release (UDI, expiry, storage, handling); (b) release documented; (c) mix-up prevention.',
    url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820', relevance: 'process-impact',
    delta: 'Release gate evidence mapped to §820.45(a)–(c)',
    impact: { labels: 0, families: [], markets: ['US'], action: 'Verification Suite evidence package re-mapped from §820.120 to §820.45' },
  },
]
