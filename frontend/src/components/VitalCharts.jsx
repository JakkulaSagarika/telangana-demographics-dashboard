import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const format = (value) => new Intl.NumberFormat('en-IN').format(value)
const colours = ['#7458d8', '#f0788b', '#38a890', '#f3aa4d']

export default function VitalCharts({ districts, overview }) {
  const leading = [...districts].sort((a, b) => b.births - a.births).slice(0, 7)
  const sex = [
    { name: 'Births · male', value: overview.births_male }, { name: 'Births · female', value: overview.births_female },
    { name: 'Deaths · male', value: overview.deaths_male }, { name: 'Deaths · female', value: overview.deaths_female },
  ]
  return <section className="chart-grid">
    <article className="chart-card"><div className="section-heading"><div><p className="eyebrow">District comparison</p><h2>Where births are highest</h2></div></div><div className="chart"><ResponsiveContainer><BarChart data={leading} layout="vertical" margin={{left: 6}}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={95} tick={{fontSize:12}} /><Tooltip formatter={format}/><Bar dataKey="births" fill="#7458d8" radius={[0,6,6,0]} /></BarChart></ResponsiveContainer></div></article>
    <article className="chart-card"><div className="section-heading"><div><p className="eyebrow">Sex distribution</p><h2>Registered vital events</h2></div></div><div className="chart"><ResponsiveContainer><PieChart><Pie data={sex} dataKey="value" innerRadius="48%" outerRadius="73%" paddingAngle={2}>{sex.map((entry, index) => <Cell key={entry.name} fill={colours[index]} />)}</Pie><Tooltip formatter={format}/><Legend iconType="circle" /></PieChart></ResponsiveContainer></div></article>
  </section>
}
