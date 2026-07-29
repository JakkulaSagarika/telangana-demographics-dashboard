import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getEducationDistrict } from '../api'
import '../education-dashboard.css'

const format = value => new Intl.NumberFormat('en-IN').format(value || 0)
export default function EducationDistrictAnalytics() {
  const { slug } = useParams(); const [district, setDistrict] = useState(null); const [error, setError] = useState('')
  useEffect(() => { getEducationDistrict(slug).then(setDistrict).catch(e => setError(e.message)) }, [slug])
  if (!district && !error) return <div className="loading">Loading district education analytics…</div>
  if (error) return <div className="notice">{error}</div>
  const literacy = [{ name: 'Male literacy', value: district.male_literacy_rate }, { name: 'Female literacy', value: district.female_literacy_rate }]
  return <div className="education-district"><Link className="back-link" to="/education">← Education dashboard</Link><section className="education-hero compact"><div><p className="eyebrow">Education analytics · State rank #{district.state_rank}</p><h1>{district.name}</h1><p>District-level literacy, school infrastructure, enrollment and higher-education capacity from the supplied government datasets.</p></div></section><section className="kpis kpis-five education-kpis"><article><span>Overall literacy</span><strong>{district.literacy_rate.toFixed(2)}%</strong></article><article><span>Total schools</span><strong>{format(district.total_schools)}</strong></article><article><span>Enrollment</span><strong>{format(district.total_enrollment)}</strong></article><article><span>Total colleges</span><strong>{format(district.total_colleges)}</strong></article><article><span>Engineering seats</span><strong>{format(district.engineering_college_seats)}</strong></article></section><section className="education-secondary"><section className="education-chart-card"><h3>Male vs female literacy</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={literacy} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}><Cell fill="#6c3cf0"/><Cell fill="#ec4899"/></Pie><Tooltip formatter={v => `${v.toFixed(2)}%`} contentStyle={{ borderRadius: 12 }}/><Legend/></PieChart></ResponsiveContainer></section><section className="education-chart-card"><h3>School infrastructure</h3><div className="district-stat-list">{Object.entries(district.school_distribution).map(([name, value]) => <p key={name}><span>{name}</span><b>{format(value)}</b></p>)}</div></section><section className="education-chart-card"><h3>College seats</h3><div className="district-stat-list">{Object.entries(district.college_seat_distribution).filter(([, value]) => value).map(([name, value]) => <p key={name}><span>{name}</span><b>{format(value)}</b></p>)}</div></section></section></div>
}
