import { useEffect, useState } from 'react'
import { getDistricts, getOverview } from '../api'
import HomeVisualGrid from '../components/HomeVisualGrid'
import '../home-dashboard.css'

const format = (value) => new Intl.NumberFormat('en-IN').format(value || 0)
export default function Home() {
  const [districts, setDistricts] = useState([]), [overview, setOverview] = useState({}), [error, setError] = useState('')
  useEffect(() => { Promise.all([getDistricts(), getOverview()]).then(([items, totals]) => { setDistricts(items); setOverview(totals) }).catch(e => setError(e.message)) }, [])
  return <>
    <section className="hero"><div><p className="eyebrow">Overview · Telangana</p><h1>Birth & death registration analytics.</h1><p>Key insights from the uploaded district registration records.</p></div><div className="hero-stat"><span>Reporting coverage</span><strong>{overview.district_count || '—'}</strong><small>Districts in the workbook</small></div></section>
    {error && <div className="notice">{error} Start Django on port 8002, then import your Excel workbook.</div>}
    <section className="kpis kpis-six home-kpis"><article><span>Total births</span><strong>{format(overview.births)}</strong></article><article><span>Total deaths</span><strong>{format(overview.deaths)}</strong></article><article><span>Male births</span><strong>{format(overview.births_male)}</strong></article><article><span>Female births</span><strong>{format(overview.births_female)}</strong></article><article><span>Birth : death ratio</span><strong>{overview.deaths ? `${(overview.births / overview.deaths).toFixed(2)} : 1` : '—'}</strong></article><article><span>Total districts</span><strong>{format(overview.district_count)}</strong></article></section>
    {districts.length > 0 ? <HomeVisualGrid districts={districts} overview={overview}/> : <div className="loading">Loading Telangana registration dashboard…</div>}</>
}
