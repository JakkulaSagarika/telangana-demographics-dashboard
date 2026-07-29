import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { getEducationOverview } from '../api'
import DistrictCombobox from '../components/DistrictCombobox'
import '../education-dashboard.css'

const categories = ['Primary', 'Upper primary', 'High', 'Model', 'KGBV', 'Central']
const colors = ['#6c3cf0', '#9d5ce6', '#f59e0b', '#ec4899', '#4e9ce6', '#4ba879']
const format = value => new Intl.NumberFormat('en-IN').format(value || 0)
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' }

function TreemapCell({ x, y, width, height, index, name, value }) {
  return <g><rect x={x} y={y} width={width} height={height} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={2} rx={5}/>{width > 70 && height > 35 && <text x={x + 9} y={y + 19} fill="#fff" fontSize={11} fontWeight="700">{name}</text>}{width > 70 && height > 52 && <text x={x + 9} y={y + 35} fill="#fff" fontSize={10}>{format(value)}</text>}</g>
}

export default function SchoolInfrastructure() {
  const [overview, setOverview] = useState(null), [error, setError] = useState(''), [districtSlug, setDistrictSlug] = useState(''), [type, setType] = useState('All'), [sortBy, setSortBy] = useState('total_schools')
  const navigate = useNavigate()
  useEffect(() => { getEducationOverview().then(setOverview).catch(e => setError(e.message)) }, [])
  const districts = overview?.districts || []
  const totals = useMemo(() => Object.fromEntries(categories.map(name => [name, districts.reduce((sum, district) => sum + (district.school_distribution[name] || 0), 0)])), [districts])
  const filtered = useMemo(() => districts.filter(d => !districtSlug || d.slug === districtSlug).sort((a, b) => { const aValue = sortBy === 'total_schools' ? a.total_schools : a.school_distribution[sortBy]; const bValue = sortBy === 'total_schools' ? b.total_schools : b.school_distribution[sortBy]; return bValue - aValue }), [districts, districtSlug, sortBy])
  const selectedTotal = district => type === 'All' ? district.total_schools : district.school_distribution[type]
  const top = [...filtered].sort((a, b) => selectedTotal(b) - selectedTotal(a)).slice(0, 10).reverse().map(d => ({ name: d.name, value: selectedTotal(d) }))
  const stackData = filtered.slice(0, 10).map(d => ({ name: d.name, ...d.school_distribution }))
  if (!overview && !error) return <div className="loading">Loading school infrastructure…</div>
  if (error) return <div className="notice">{error}</div>
  return <div className="school-infrastructure">
    <section className="infrastructure-heading"><div><p className="eyebrow">Education analytics · school infrastructure</p><h1>School infrastructure explorer</h1><p>District-wise primary, upper-primary, high, model, KGBV and central school availability.</p></div><div className="infrastructure-total"><span>Reported schools</span><strong>{format(overview.total_schools)}</strong><small>{districts.length} reporting districts</small></div></section>
    <section className="infrastructure-kpis">{categories.map((name, index) => <article key={name}><i style={{ background: colors[index] }}/><span>{name} schools</span><strong>{format(totals[name])}</strong><small>{overview.total_schools ? ((totals[name] / overview.total_schools) * 100).toFixed(1) : 0}% of reported schools</small></article>)}</section>
    <section className="infra-filters"><DistrictCombobox districts={districts} value={districtSlug} onChange={setDistrictSlug} label="Filter district"/><label>School type<select value={type} onChange={event => setType(event.target.value)}><option>All</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Rank table by<select value={sortBy} onChange={event => setSortBy(event.target.value)}><option value="total_schools">Total schools</option>{categories.map(category => <option key={category} value={category}>{category} schools</option>)}</select></label></section>
    <section className="infra-main-charts"><article className="education-chart-card"><h3>School category share</h3><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={categories.map(name => ({ name, value: totals[name] })).filter(item => item.value)} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={2}>{categories.map((name, index) => <Cell key={name} fill={colors[index]}/>)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={format}/><Legend wrapperStyle={{ fontSize: 10 }}/></PieChart></ResponsiveContainer></article><article className="education-chart-card"><h3>Infrastructure mix by district</h3><ResponsiveContainer width="100%" height={290}><BarChart data={stackData} margin={{ left: -18, right: 3 }}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="name" tickFormatter={value => value.split(' ')[0]} tick={{ fontSize: 9 }}/><YAxis tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Legend wrapperStyle={{ fontSize: 9 }}/>{categories.map((category, index) => <Bar key={category} dataKey={category} stackId="schools" fill={colors[index]}/>)}</BarChart></ResponsiveContainer></article><article className="education-chart-card"><h3>Statewide school treemap</h3><ResponsiveContainer width="100%" height={290}><Treemap data={categories.map(name => ({ name, value: totals[name] }))} dataKey="value" aspectRatio={4 / 3} content={<TreemapCell/>}><Tooltip contentStyle={tooltipStyle} formatter={format}/></Treemap></ResponsiveContainer></article></section>
    <section className="infra-ranking-card"><div><h2>District rankings</h2><p>Top 10 districts by {type === 'All' ? 'total schools' : `${type.toLowerCase()} schools`}.</p></div><ResponsiveContainer width="100%" height={330}><BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} stroke="#eee6dc"/><XAxis type="number" tick={{ fontSize: 10 }}/><YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Bar dataKey="value" fill="#6c3cf0" radius={[0, 7, 7, 0]}/></BarChart></ResponsiveContainer></section>
    <section className="infra-table-card"><div className="infra-table-title"><div><h2>District-wise school table</h2><p>Click any district to open its education profile.</p></div><span>{filtered.length} districts shown</span></div><div className="infra-table-wrap"><table><thead><tr><th>District</th><th>Total schools</th>{categories.map(category => <th key={category}>{category}</th>)}</tr></thead><tbody>{filtered.map(district => <tr key={district.slug} onClick={() => navigate(`/education/districts/${district.slug}`)}><td><b>{district.name}</b><small>View district analytics →</small></td><td>{format(district.total_schools)}</td>{categories.map(category => <td key={category}>{format(district.school_distribution[category])}</td>)}</tr>)}</tbody></table></div></section>
  </div>
}
