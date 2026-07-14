import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import DistrictMap from './DistrictMap'

const format = value => new Intl.NumberFormat('en-IN').format(value || 0)
const palette = ['#6c3cf0', '#8d61f4', '#ae87f7', '#d7c5ff', '#f3a44b']

function Panel({ eyebrow, title, children, className = '' }) {
  return <article className={`home-panel ${className}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</article>
}

export default function HomeVisualGrid({ districts, overview }) {
  const topTen = [...districts].filter(d => d.births > 0).sort((a, b) => b.births - a.births).slice(0, 10)
  const topFive = topTen.slice(0, 5)
  const distribution = [
    { name: 'Gram Panchayat', value: districts.reduce((sum, d) => sum + d.gram_panchayat_births, 0), color: '#75af75' },
    { name: 'Municipality', value: districts.reduce((sum, d) => sum + d.municipality_births, 0), color: '#4d7ed9' },
    { name: 'Municipal Corporation', value: districts.reduce((sum, d) => sum + d.corporation_births, 0), color: '#bc72d8' },
  ]
  const birthLeader = topTen[0]
  const deathLeader = [...districts].sort((a, b) => b.deaths - a.deaths)[0]
  const femaleShare = overview.births ? ((overview.births_female / overview.births) * 100).toFixed(1) : '—'
  return <>
    <section className="home-visual-grid">
      <Panel eyebrow="Top 10 districts" title="Birth count" className="birth-ranking"><div className="home-chart ranking-chart"><ResponsiveContainer><BarChart data={topTen} layout="vertical" margin={{left:10,right:10}}><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={110} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip formatter={format}/><Bar dataKey="births" radius={[0,7,7,0]}>{topTen.map((d, i) => <Cell key={d.slug} fill={palette[i % palette.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></Panel>
      <Panel eyebrow="Registration mix" title="Birth distribution" className="registration-donut"><div className="donut-layout"><div className="home-chart donut-chart"><ResponsiveContainer><PieChart><Pie data={distribution} dataKey="value" innerRadius={47} outerRadius={75} paddingAngle={3}>{distribution.map(item => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip formatter={format}/></PieChart></ResponsiveContainer></div><div className="home-legend">{distribution.map(item => <div key={item.name}><i style={{background:item.color}}/><span>{item.name}</span><b>{format(item.value)}</b></div>)}</div></div></Panel>
      <Panel eyebrow="Telangana registration map" title="District birth intensity" className="map-panel"><DistrictMap districts={districts}/></Panel>
      <Panel eyebrow="Top 5 districts" title="Births vs deaths" className="birth-death"><div className="home-chart"><ResponsiveContainer><BarChart data={topFive}><XAxis dataKey="name" tick={{fontSize:9}} axisLine={false}/><YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{fontSize:10}} axisLine={false}/><Tooltip formatter={format}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/><Bar dataKey="births" name="Births" fill="#7649d9" radius={[5,5,0,0]}/><Bar dataKey="deaths" name="Deaths" fill="#f2a244" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
      <Panel eyebrow="Top 5 districts" title="Male vs female births" className="sex-comparison"><div className="home-chart"><ResponsiveContainer><BarChart data={topFive}><XAxis dataKey="name" tick={{fontSize:9}} axisLine={false}/><YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{fontSize:10}} axisLine={false}/><Tooltip formatter={format}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/><Bar dataKey="births_male" name="Male births" stackId="sex" fill="#4a80ed" radius={[5,5,0,0]}/><Bar dataKey="births_female" name="Female births" stackId="sex" fill="#ef6da3" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
    </section>
    <section className="home-bottom"><Panel eyebrow="Recent updates" title="Registration highlights"><div className="update-list"><Link to={`/districts/${birthLeader?.slug}`}><span>Highest birth count</span><b>{birthLeader?.name || '—'}</b><strong>{format(birthLeader?.births)}</strong> →</Link><Link to={`/districts/${deathLeader?.slug}`}><span>Highest death count</span><b>{deathLeader?.name || '—'}</b><strong>{format(deathLeader?.deaths)}</strong> →</Link></div></Panel><Panel eyebrow="Quick insights" title="Statewide snapshot"><div className="insight-list"><div><span>Female share of births</span><b>{femaleShare}%</b></div><div><span>Births per recorded death</span><b>{overview.deaths ? (overview.births / overview.deaths).toFixed(2) : '—'} : 1</b></div><div><span>Districts with imported records</span><b>{overview.district_count || 0}</b></div></div></Panel></section>
  </>
}
