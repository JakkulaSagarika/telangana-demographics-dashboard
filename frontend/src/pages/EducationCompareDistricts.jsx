import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getEducationOverview } from '../api'
import DistrictCombobox from '../components/DistrictCombobox'
import '../education-dashboard.css'

const format = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)
const fields = [
  ['Literacy', 'literacy_rate', '%'], ['Male literacy', 'male_literacy_rate', '%'], ['Female literacy', 'female_literacy_rate', '%'],
  ['Schools', 'total_schools', ''], ['Enrollment', 'total_enrollment', ''], ['Engineering colleges', 'engineering_colleges', ''],
  ['Degree colleges', 'degree_colleges', ''], ['Engineering seats', 'engineering_college_seats', ''],
]
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' }

function display(value, suffix) { return suffix ? `${Number(value || 0).toFixed(2)}${suffix}` : format(value) }
function score(district, field, maxima) { return Math.round(((district?.[field] || 0) / Math.max(maxima[field] || 1, 1)) * 100) }

export default function EducationCompareDistricts() {
  const [overview, setOverview] = useState(null), [error, setError] = useState(''), [firstSlug, setFirstSlug] = useState(''), [secondSlug, setSecondSlug] = useState('')
  useEffect(() => { getEducationOverview().then(data => { setOverview(data); setFirstSlug(data.districts[0]?.slug || ''); setSecondSlug(data.districts[1]?.slug || data.districts[0]?.slug || '') }).catch(e => setError(e.message)) }, [])
  const districts = overview?.districts || []
  const [first, second] = [districts.find(d => d.slug === firstSlug), districts.find(d => d.slug === secondSlug)]
  const maxima = useMemo(() => Object.fromEntries(fields.map(([, key]) => [key, Math.max(...districts.map(d => d[key] || 0), 1)])), [districts])
  const averages = useMemo(() => Object.fromEntries(fields.map(([, key]) => [key, districts.reduce((sum, d) => sum + (d[key] || 0), 0) / Math.max(districts.length, 1)])), [districts])
  if (!overview && !error) return <div className="loading">Loading district comparison data…</div>
  if (error) return <div className="notice">{error}</div>
  const comparisonData = fields.map(([label, key]) => ({ metric: label, [first.name]: score(first, key, maxima), [second.name]: score(second, key, maxima) }))
  const barData = fields.map(([label, key]) => ({ metric: label, [first.name]: first[key] || 0, [second.name]: second[key] || 0 }))
  const wins = (district, other) => fields.filter(([, key]) => (district[key] || 0) > (other[key] || 0)).map(([label]) => label)
  const firstWins = wins(first, second), secondWins = wins(second, first)
  const summary = district => { const leads = wins(district, district === first ? second : first); const leading = leads.length ? leads.slice(0, 3).join(', ').toLowerCase() : 'no selected indicators'; return `${district.name} is strongest in ${leading}. It has ${display(district.literacy_rate, '%')} literacy, ${format(district.total_schools)} schools, and ${format(district.total_enrollment)} recorded enrollment.` }
  return <div className="education-compare">
    <section className="compare-heading"><div><p className="eyebrow">Education analytics · district explorer</p><h1>Compare districts</h1><p>Compare education indicators, infrastructure and capacity side by side using the supplied Telangana datasets.</p></div><div className="compare-selectors"><DistrictCombobox districts={districts} value={firstSlug} onChange={setFirstSlug} label="District 1" allowAll={false}/><DistrictCombobox districts={districts} value={secondSlug} onChange={setSecondSlug} label="District 2" allowAll={false}/></div></section>
    <section className="compare-identity"><article className="district-a"><span>District 1</span><h2>{first.name}</h2><b>#{first.state_rank} literacy rank</b></article><div className="compare-versus">VS</div><article className="district-b"><span>District 2</span><h2>{second.name}</h2><b>#{second.state_rank} literacy rank</b></article></section>
    <section className="compare-cards">{fields.map(([label, key, suffix]) => { const a = first[key] || 0, b = second[key] || 0; const difference = a - b; return <article key={key}><span>{label}</span><div><b>{display(a, suffix)}</b><i>vs</i><b>{display(b, suffix)}</b></div><small className={difference === 0 ? '' : difference > 0 ? 'first-ahead' : 'second-ahead'}>{difference === 0 ? 'Equal value' : `${difference > 0 ? first.name : second.name} leads by ${display(Math.abs(difference), suffix)}`}</small></article> })}</section>
    <section className="compare-charts"><article className="education-chart-card"><h3>Overall education profile</h3><ResponsiveContainer width="100%" height={330}><RadarChart data={comparisonData}><PolarGrid stroke="#e8deee"/><PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#604f70' }}/><PolarRadiusAxis tick={{ fontSize: 9 }}/><Radar name={first.name} dataKey={first.name} stroke="#6c3cf0" fill="#6c3cf0" fillOpacity={.32}/><Radar name={second.name} dataKey={second.name} stroke="#ec4899" fill="#ec4899" fillOpacity={.25}/><Legend wrapperStyle={{ fontSize: 11 }}/><Tooltip contentStyle={tooltipStyle}/></RadarChart></ResponsiveContainer><p className="comparison-note">Scores are normalized against the highest available reporting-district value for each indicator.</p></article><article className="education-chart-card"><h3>Indicator comparison</h3><ResponsiveContainer width="100%" height={330}><BarChart data={barData} margin={{ left: -16, right: 4 }}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="metric" tick={{ fontSize: 9 }} interval={0}/><YAxis tick={{ fontSize: 10 }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)}k` : value}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Legend wrapperStyle={{ fontSize: 11 }}/><Bar dataKey={first.name} fill="#6c3cf0" radius={[5,5,0,0]}/><Bar dataKey={second.name} fill="#ec4899" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></article></section>
    <section className="compare-table-card"><h2>Side-by-side statistics</h2><div className="compare-table-wrap"><table><thead><tr><th>Indicator</th><th>{first.name}</th><th>{second.name}</th><th>Difference</th><th>Telangana average</th></tr></thead><tbody>{fields.map(([label, key, suffix]) => { const a = first[key] || 0, b = second[key] || 0, difference = a - b; return <tr key={key}><td>{label}</td><td className={a > b ? 'better' : ''}>{display(a, suffix)}</td><td className={b > a ? 'better' : ''}>{display(b, suffix)}</td><td>{difference === 0 ? '—' : `${difference > 0 ? '+' : '−'}${display(Math.abs(difference), suffix)}`}</td><td>{display(averages[key], suffix)}</td></tr> })}</tbody></table></div></section>
    <section className="compare-bottom"><article className="education-chart-card"><h3>{first.name} strengths</h3><p>{summary(first)}</p><div className="strength-tags">{firstWins.length ? firstWins.map(item => <span key={item}>{item}</span>) : <span>Balanced comparison</span>}</div></article><article className="education-chart-card"><h3>{second.name} strengths</h3><p>{summary(second)}</p><div className="strength-tags pink">{secondWins.length ? secondWins.map(item => <span key={item}>{item}</span>) : <span>Balanced comparison</span>}</div></article><article className="education-chart-card"><h3>Comparison with Telangana</h3><div className="average-summary"><p><span>{first.name}</span><b>{first.literacy_rate >= averages.literacy_rate ? 'Above' : 'Below'} average literacy</b></p><p><span>{second.name}</span><b>{second.literacy_rate >= averages.literacy_rate ? 'Above' : 'Below'} average literacy</b></p><small>State comparisons use the average across the {districts.length} reporting districts in the uploaded datasets.</small></div></article></section>
  </div>
}
