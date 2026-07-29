import { useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'

const metrics = {
  births: { label: 'Total births', colour: '#7354d6' },
  deaths: { label: 'Total deaths', colour: '#ed6d88' },
  births_male: { label: 'Male births', colour: '#3d7df0' },
  births_female: { label: 'Female births', colour: '#e753a0' },
}
const number = (value) => new Intl.NumberFormat('en-IN').format(value || 0)

export default function InsightStudio({ districts, overview }) {
  const [metric, setMetric] = useState('births')
  const [selected, setSelected] = useState(null)
  const ranked = useMemo(() => [...districts].filter(d => d[metric] > 0).sort((a, b) => b[metric] - a[metric]).slice(0, 10), [districts, metric])
  const localBodies = [
    { name: 'Gram Panchayats', births: districts.reduce((sum, d) => sum + d.gram_panchayat_births, 0), deaths: districts.reduce((sum, d) => sum + d.gram_panchayat_deaths, 0), colour: '#3bb398' },
    { name: 'Municipalities', births: districts.reduce((sum, d) => sum + d.municipality_births, 0), deaths: districts.reduce((sum, d) => sum + d.municipality_deaths, 0), colour: '#f3a748' },
    { name: 'Corporations', births: districts.reduce((sum, d) => sum + d.corporation_births, 0), deaths: districts.reduce((sum, d) => sum + d.corporation_deaths, 0), colour: '#7b64d6' },
  ]
  const sexData = [
    { name: 'Births', male: overview.births_male, female: overview.births_female },
    { name: 'Deaths', male: overview.deaths_male, female: overview.deaths_female },
  ]
  return <section className="insight-studio">
    <div className="studio-heading"><div><p className="eyebrow">Interactive explorer</p><h2>Compare district vital events</h2><p>Choose a measure to reorder the leading districts.</p></div><div className="metric-pills">{Object.entries(metrics).map(([key, item]) => <button className={metric === key ? 'is-active' : ''} onClick={() => { setMetric(key); setSelected(null) }} key={key}>{item.label}</button>)}</div></div>
    <div className="rank-visual"><ResponsiveContainer><BarChart data={ranked} layout="vertical" margin={{ left: 12, right: 20 }}><XAxis type="number" tickFormatter={value => `${Math.round(value / 1000)}k`} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={125} tick={{fontSize: 12}} axisLine={false} tickLine={false}/><Tooltip formatter={number} cursor={{fill: '#f1edff'}}/><Bar dataKey={metric} radius={[0, 9, 9, 0]} onClick={entry => setSelected(entry)}>{ranked.map((entry, index) => <Cell key={entry.slug} fill={index === 0 ? metrics[metric].colour : `${metrics[metric].colour}bb`} />)}</Bar></BarChart></ResponsiveContainer></div>
    {selected && <Link className="selection-chip" to={`/demographics/districts/${selected.slug}`}><span>Selected district</span><b>{selected.name}</b><strong>{number(selected[metric])}</strong> Open profile →</Link>}
    <div className="studio-lower"><article className="mini-viz"><p className="eyebrow">Male / female</p><h3>Sex distribution</h3><div className="mini-chart"><ResponsiveContainer><BarChart data={sexData}><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={number}/><Legend/><Bar dataKey="male" stackId="event" fill="#4385f5" radius={[5,5,0,0]}/><Bar dataKey="female" stackId="event" fill="#ee68a4" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></article>
      <article className="mini-viz"><p className="eyebrow">Local-body mix</p><h3>Where records are registered</h3><div className="body-mix"><div className="mix-pie"><ResponsiveContainer><PieChart><Pie data={localBodies} dataKey="births" innerRadius={44} outerRadius={76} paddingAngle={3}>{localBodies.map(body => <Cell fill={body.colour} key={body.name}/>)}</Pie><Tooltip formatter={number}/></PieChart></ResponsiveContainer></div><div className="mix-list">{localBodies.map(body => <div key={body.name}><i style={{background: body.colour}}/><span>{body.name}</span><b>{number(body.births)}</b><small>births · {number(body.deaths)} deaths</small></div>)}</div></div></article></div>
  </section>
}
