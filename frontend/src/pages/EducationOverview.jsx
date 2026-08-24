import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getEducationMultiYearOverview } from '../api'
import EducationMap from '../components/EducationMap'
import '../education-dashboard.css'

const format = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
const palette = ['#6c3cf0', '#9d5ce6', '#f59e0b', '#ec4899', '#4e9ce6', '#4ba879', '#c97535']
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' }
const ChartCard = ({ title, children }) => <section className="education-chart-card"><h3>{title}</h3>{children}</section>
const categories = (annual, key) => [...new Set(annual.flatMap(item => Object.keys(item[key] || {})))]
const categorySeries = (annual, key) => annual.map(item => ({ year: item.year, ...Object.fromEntries(categories(annual, key).map(name => [name, item[key]?.[name] || 0])) }))

function Change({ value, previous }) {
  if (value == null || previous == null || !previous) return <small>First available reporting year</small>
  const change = ((value - previous) / previous) * 100
  return <small className={change >= 0 ? 'metric-change positive' : 'metric-change negative'}>{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs prior available year</small>
}

export default function EducationOverview() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [year, setYear] = useState('All Years'), [layer, setLayer] = useState('schools')
  useEffect(() => { getEducationMultiYearOverview().then(setData).catch(error => setError(error.message)) }, [])
  const annual = data?.annual || []
  const selected = year === 'All Years' ? null : data?.by_year?.[year]
  if (!data && !error) return <div className="loading">Loading supplied Telangana education datasets…</div>
  if (error) return <div className="notice">{error} The multi-year dashboard needs the supplied CSV files to remain available.</div>
  return <div className="education-overview" id="education-dashboard">
    <section className="education-hero"><div><p className="eyebrow">Home · Education analytics</p><h1>Education Statistics Dashboard</h1><p>Government of Telangana · Compare only the supplied school and college reporting years.</p></div><div className="education-hero-mark"><span>✦</span><b>Education<br/>for every learner</b></div></section>
    <section className="education-year-control"><label htmlFor="education-year">Reporting year</label><select id="education-year" value={year} onChange={event => setYear(event.target.value)}><option>All Years</option>{data.years.map(item => <option key={item}>{item}</option>)}</select><span>{year === 'All Years' ? `${annual.length} supplied reporting years` : 'Selected year district detail'}</span></section>
    {selected ? <YearDetail data={selected} layer={layer} setLayer={setLayer}/> : <AllYears annual={annual} literacyNote={data.literacy_note}/>}
  </div>
}

function AllYears({ annual, literacyNote }) {
  const latest = field => [...annual].reverse().find(item => item[field] != null)
  const prior = (field, current) => annual.filter(item => item.year !== current && item[field] != null).at(-1)?.[field]
  const schools = latest('total_schools'), colleges = latest('total_colleges'), enrollment = latest('total_enrollment')
  const trends = annual.map(item => ({ year: item.year, schools: item.total_schools, colleges: item.total_colleges, enrollment: item.total_enrollment }))
  const schoolKeys = categories(annual, 'school_categories'), collegeKeys = categories(annual, 'college_categories')
  const Trend = ({ title, field, color, type = 'line' }) => <ChartCard title={title}><ResponsiveContainer width="100%" height={250}>{type === 'line' ? <LineChart data={trends}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="year" tick={{ fontSize: 10 }}/><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Line connectNulls type="monotone" dataKey={field} stroke={color} strokeWidth={3} dot={{ r: 4 }}/></LineChart> : <BarChart data={trends}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="year" tick={{ fontSize: 10 }}/><YAxis tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Bar dataKey={field} fill={color} radius={[6, 6, 0, 0]}/></BarChart>}</ResponsiveContainer></ChartCard>
  const CategoryChart = ({ title, data, keys, stack }) => <ChartCard title={title}><ResponsiveContainer width="100%" height={270}><BarChart data={data}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="year" tick={{ fontSize: 10 }}/><YAxis tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Legend wrapperStyle={{ fontSize: 10 }}/>{keys.map((key, index) => <Bar key={key} dataKey={key} stackId={stack} fill={palette[index % palette.length]}/>)}</BarChart></ResponsiveContainer></ChartCard>
  return <>
    <section className="kpis kpis-five education-kpis multi-year-kpis"><article><span>Total schools</span><strong>{format(schools?.total_schools)}</strong><Change value={schools?.total_schools} previous={prior('total_schools', schools?.year)}/><small>{schools?.year} school dataset</small></article><article><span>Total colleges</span><strong>{format(colleges?.total_colleges)}</strong><Change value={colleges?.total_colleges} previous={prior('total_colleges', colleges?.year)}/><small>{colleges?.year} where supplied</small></article><article><span>Total enrollment</span><strong>{format(enrollment?.total_enrollment)}</strong><Change value={enrollment?.total_enrollment} previous={prior('total_enrollment', enrollment?.year)}/><small>{enrollment?.year} school enrollment</small></article><article><span>Literacy</span><strong>Not reported</strong><small>Not calculated without a supplied annual file</small></article><article><span>Coverage</span><strong>{annual.length} years</strong><small>2020–21 supplies colleges only</small></article></section>
    <section className="education-trend-grid"><Trend title="Total schools by reporting year" field="schools" color="#6c3cf0"/><Trend title="Total colleges by reporting year" field="colleges" color="#ec4899" type="bar"/><Trend title="School enrollment by reporting year" field="enrollment" color="#f59e0b"/></section>
    <section className="education-trend-grid two-up"><CategoryChart title="School categories across reporting years" data={categorySeries(annual, 'school_categories')} keys={schoolKeys} stack="schools"/><CategoryChart title="College categories where available" data={categorySeries(annual, 'college_categories')} keys={collegeKeys} stack="colleges"/></section>
    <section className="education-data-note"><b>Literacy data note</b><span>{literacyNote}</span></section>
  </>
}

function YearDetail({ data, layer, setLayer }) {
  const districts = data.districts || []
  const top = field => [...districts].filter(item => item[field] != null).sort((a, b) => b[field] - a[field]).slice(0, 7)
  const mix = field => Object.entries(data[field] || {}).filter(([, value]) => value).map(([name, value]) => ({ name, value }))
  const availability = data.availability
  const PieCard = ({ title, field }) => { const values = mix(field); return <ChartCard title={title}><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={values} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>{values.map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={format}/><Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10 }}/></PieChart></ResponsiveContainer></ChartCard> }
  return <>
    <section className="kpis kpis-five education-kpis"><article><span>Total schools</span><strong>{format(data.total_schools)}</strong><small>{availability.schools ? 'Supplied school dataset' : 'Not supplied this year'}</small></article><article><span>Total colleges</span><strong>{format(data.total_colleges)}</strong><small>{availability.colleges ? 'Supplied college categories' : 'Not supplied this year'}</small></article><article><span>Total enrollment</span><strong>{format(data.total_enrollment)}</strong><small>{availability.enrollment ? 'Supplied school enrollment' : 'Not supplied this year'}</small></article><article><span>College seats</span><strong>{format(data.total_college_seats)}</strong><small>{availability.college_seats ? 'Where supplied' : 'Not supplied this year'}</small></article><article><span>District coverage</span><strong>{data.district_count}</strong><small>Reporting districts in supplied file(s)</small></article></section>
    <section className="education-main"><div className="education-side"><ChartCard title="Largest school networks"><ResponsiveContainer width="100%" height={250}><BarChart data={top('total_schools')} layout="vertical" margin={{ left: 4, right: 8 }}><CartesianGrid horizontal={false} stroke="#eee6dc"/><XAxis type="number" tick={{ fontSize: 10 }}/><YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Bar dataKey="total_schools" fill="#6c3cf0" radius={[0, 8, 8, 0]}/></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Enrollment by district"><ResponsiveContainer width="100%" height={250}><BarChart data={top('total_enrollment')}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="name" tickFormatter={value => value.split(' ')[0]} tick={{ fontSize: 9 }}/><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10 }}/><Tooltip contentStyle={tooltipStyle} formatter={format}/><Bar dataKey="total_enrollment" fill="#f59e0b" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></ChartCard></div><section className="education-map-card"><div className="map-card-heading"><div><h2>Telangana education map · {data.year}</h2><p>Only layers with supplied values are shown.</p></div><div className="education-layer-pills">{[['schools', 'Schools', availability.schools], ['enrollment', 'Enrollment', availability.enrollment], ['colleges', 'Colleges', availability.colleges]].filter(([, , enabled]) => enabled).map(([key, label]) => <button className={layer === key ? 'active' : ''} onClick={() => setLayer(key)} key={key}>{label}</button>)}</div></div><EducationMap districts={districts} layer={layer}/></section><div className="education-side"><PieCard title="School distribution" field="school_categories"/><PieCard title="College distribution" field="college_categories"/></div></section>
  </>
}
