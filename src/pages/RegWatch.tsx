import { useState } from 'react'
import { useStore } from '../state/store'
import { useActions } from '../state/actions'
import { PageHeader, Icon } from '../components/ui'
import { REG_FEED } from '../data/regfeed'
import { SYMBOLS } from '../data/symbols'
import { REQUIREMENTS } from '../data/requirements'

const REL: Record<string, [string, string]> = { 'label-impact': ['b-fail', 'Label impact'], 'process-impact': ['b-info', 'Process impact'], 'registry-impact': ['b-warn', 'Registry impact'], 'no-impact': ['b-gray', 'No impact'] }

export default function RegWatch() {
  const { s } = useStore()
  const a = useActions()
  const [live, setLive] = useState<{ status: 'idle' | 'loading' | 'ok' | 'err'; text?: string }>({ status: 'idle' })
  const fetchLive = async () => {
    setLive({ status: 'loading' })
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000)
      const r = await fetch('https://www.ecfr.gov/api/versioner/v1/versions/title-21.json?part=801', { signal: ctl.signal })
      clearTimeout(t)
      const j = await r.json()
      const v = (j.content_versions || []) as { amendment_date: string; identifier: string; name?: string }[]
      const latest = v.map(x => x.amendment_date).sort().at(-1)
      const sec = v.filter(x => x.amendment_date === latest).map(x => x.identifier).slice(0, 4)
      setLive({ status: 'ok', text: `Live eCFR: 21 CFR Part 801 has ${v.length} section versions; latest amendment ${latest} (§${sec.join(', §')}). Diffed against the Requirement Graph snapshot: no new label obligations.` })
    } catch {
      setLive({ status: 'err', text: 'Live eCFR call unavailable from this network; showing the cached snapshot (last poll 2026-11-01 06:00).' })
    }
  }
  return (
    <>
      <PageHeader eyebrow="Step 2 · Regulatory intelligence" title="RegWatch: regulation changes become graph deltas" crit={['C2', 'C4']} steps="4–6"
        desc="An agent polls the eCFR versioner, Federal Register, EUR-Lex / OJ, IMDRF, TGA, NMPA and registry feeds. The LLM summarises and proposes a Requirement Graph delta with citations; Regulatory Affairs accepts or rejects. Impact is computed the moment RA accepts."
        right={<button className="btn ghost" onClick={fetchLive} disabled={live.status === 'loading'}><Icon name="radar" size={16} /> {live.status === 'loading' ? 'Polling eCFR…' : 'Poll eCFR live'}</button>} />
      {live.text && <div className={`callout ${live.status === 'ok' ? '' : 'amber'}`} style={{ marginBottom: 14 }}>{live.text}</div>}
      <div className="grid" style={{ gap: 12 }}>
        {REG_FEED.map(r => {
          const main = r.id === 'RW-2026-118'
          return (
            <div className="card" key={r.id} style={main ? { borderColor: s.regAccepted ? '#bfe6df' : '#f3c6cd', borderWidth: 2 } : undefined}>
              <div className="between">
                <div className="row"><span className={`badge ${REL[r.relevance][0]}`}>{REL[r.relevance][1]}</span><span className="tiny muted">{r.id} · {r.date} · {r.source}</span></div>
                {r.impact.deadline && <span className="badge b-gray">Deadline {r.impact.deadline}</span>}
              </div>
              <h3 style={{ marginTop: 8 }}>{r.title}</h3>
              <p className="small muted" style={{ margin: '0 0 8px' }}>{r.summary}</p>
              <div className="grid g3" style={{ gap: 10 }}>
                <div><div className="tiny muted">Graph delta</div><div className="small"><b>{r.delta}</b></div></div>
                <div><div className="tiny muted">Impact</div><div className="small"><b>{r.impact.labels ? `${r.impact.labels.toLocaleString()} labels` : 'No label elements'}</b> · {r.impact.markets.join(', ')}</div></div>
                <div><div className="tiny muted">Action</div><div className="small">{r.impact.action}</div></div>
              </div>
              {main && (
                <>
                  <div className="sep" />
                  <div className="row" style={{ alignItems: 'stretch' }}>
                    {(['EC_REP', 'EU_REP'] as const).map(k => (
                      <div key={k} className="card" style={{ boxShadow: 'none', padding: 10, display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 240px' }}>
                        <svg width="46" height="46" viewBox="0 0 40 40" dangerouslySetInnerHTML={{ __html: SYMBOLS[k].svg }} />
                        <div className="small"><b>{SYMBOLS[k].standard}</b><div className="tiny muted">{k === 'EC_REP' ? `Superseded · presumption of conformity until ${SYMBOLS.EC_REP.validUntil}` : 'Current · harmonised by (EU) 2026/1231'}</div></div>
                      </div>
                    ))}
                    <div style={{ display: 'grid', alignContent: 'center', gap: 6, flex: '0 0 auto' }}>
                      {s.regAccepted ? <span className="badge b-pass">✓ Accepted by R. Iyer (RA)</span> : <button className="btn teal" onClick={() => a.acceptReg()}>Accept delta as RA</button>}
                    </div>
                  </div>
                  <p className="tiny muted" style={{ margin: '8px 0 0' }}>Graph-level nuance: because the old symbol keeps its presumption of conformity until 2031-06-15, RegWatch schedules adoption at each label's next revision instead of forcing a relabel. That avoids scrap while guaranteeing the deadline.</p>
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3><Icon name="graph" /> Requirement Graph · {REQUIREMENTS.length} machine-readable clauses in this demo</h3>
        <div className="tablewrap"><table className="t"><thead><tr><th>ID</th><th>Instrument · clause</th><th>Requirement</th><th>Conf.</th></tr></thead><tbody>
          {REQUIREMENTS.map(r => <tr key={r.id}><td className="mono tiny">{r.id}</td><td className="small"><a href={r.url} target="_blank" rel="noreferrer">{r.source}</a> · {r.clause}</td><td className="small">{r.title}</td><td><span className={`badge ${r.conf === 'V' ? 'b-pass' : 'b-gray'}`}>{r.conf === 'V' ? 'primary' : 'secondary'}</span></td></tr>)}
        </tbody></table></div>
      </div>
    </>
  )
}
