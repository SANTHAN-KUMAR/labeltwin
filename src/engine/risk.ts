// Predictive label-risk score (explainable additive model). Weights are calibrated priors from the
// openFDA labeling-recall taxonomy (2023-2026); production retrains on the client's own CAPA/FAI history.
export interface RiskFeature { key: string; label: string; value: string; points: number }
export interface RiskResult { score: number; tier: 'Low' | 'Medium' | 'High'; features: RiskFeature[]; reviewers: string[] }

export function scoreChange(input: {
  deviceClass: string; implant: boolean; sterilizationChange: boolean; shelfLifeChange: boolean; symbolChange: boolean
  markets: number; languages: number; newPhrases: number; legacyOverridesFound: number; priorLabelCapa: boolean; labelsImpacted: number
}): RiskResult {
  const f: RiskFeature[] = []
  const add = (key: string, label: string, value: string, points: number) => points && f.push({ key, label, value, points })
  add('class', 'Device risk class', input.deviceClass, input.deviceClass.startsWith('III') ? 18 : input.deviceClass.startsWith('IIb') ? 10 : 4)
  add('implant', 'Implantable', input.implant ? 'yes' : 'no', input.implant ? 8 : 0)
  add('steril', 'Sterilization method change', input.sterilizationChange ? 'EO → irradiation' : 'none', input.sterilizationChange ? 14 : 0)
  add('shelf', 'Expiry-affecting change', input.shelfLifeChange ? 'shelf life' : 'none', input.shelfLifeChange ? 9 : 0)
  add('sym', 'Symbol change', input.symbolChange ? 'yes' : 'no', input.symbolChange ? 5 : 0)
  add('mkts', 'Markets', String(input.markets), Math.min(8, input.markets))
  add('langs', 'Languages', String(input.languages), Math.min(8, Math.round(input.languages / 3)))
  add('phr', 'New (unapproved) phrases', String(input.newPhrases), input.newPhrases * 6)
  add('legacy', 'Legacy hard-coded fields found', String(input.legacyOverridesFound), input.legacyOverridesFound * 3)
  add('capa', 'Prior labeling CAPA on family', input.priorLabelCapa ? 'yes' : 'no', input.priorLabelCapa ? 4 : 0)
  add('scale', 'Labels impacted', String(input.labelsImpacted), input.labelsImpacted > 500 ? 6 : input.labelsImpacted > 50 ? 3 : 1)
  const score = Math.min(100, f.reduce((s, x) => s + x.points, 0))
  const tier = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low'
  const reviewers = tier === 'High' ? ['Labeling Engineer', 'Regulatory Affairs', 'Quality Assurance', 'Clinical / Medical'] : tier === 'Medium' ? ['Labeling Engineer', 'Quality Assurance'] : ['Quality Assurance']
  return { score, tier, features: f.sort((a, b) => b.points - a.points), reviewers }
}
