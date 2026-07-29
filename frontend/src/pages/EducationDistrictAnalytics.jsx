import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useParams } from 'react-router-dom'
import { getEducationDistrict } from '../api'
import '../education-dashboard.css'

const palette = ['#6c3cf0', '#9d5ce6', '#f59e0b', '#ec4899', '#4e9ce6', '#4ba879', '#c18c4e', '#8b6dca']
const format = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)
const chartTooltip = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' }
const ChartCard = ({ title, children, className = '' }) => <section className={`education-chart-card ${className}`}><h3>{title}</h3>{children}</section>

function Donut({ data }) {
  return <ResponsiveContainer width="100%" height={252}><PieChart><Pie data={data.filter(item => item.value)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>{data.filter(item => item.value).map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]}/>)}</Pie><Tooltip contentStyle={chartTooltip} formatter={format}/><Legend wrapperStyle={{ fontSize: 10 }}/></PieChart></ResponsiveContainer>
}

function Column({ data, valueKey, colour = '#6c3cf0', percent = false }) {
  return <ResponsiveContainer width="100%" height={252}><BarChart data={data} margin={{ left: -18, right: 4 }}><CartesianGrid vertical={false} stroke="#eee6dc"/><XAxis dataKey="name" tick={{ fontSize: 9 }}/><YAxis tickFormatter={value => percent ? `${value}%` : `${Math.round(value / 1000)}k`} tick={{ fontSize: 10 }}/><Tooltip contentStyle={chartTooltip} formatter={value => percent ? `${value.toFixed(2)}%` : format(value)}/><Bar dataKey={valueKey} fill={colour} radius={[7, 7, 0, 0]}/></BarChart></ResponsiveContainer>
}

const scoreLabel = score => score >= 75 ? 'Leading profile' : score >= 55 ? 'Strong foundation' : 'Growth opportunity'

export default function EducationDistrictAnalytics() {
  const { slug } = useParams()
  const [district, setDistrict] = useState(null), [error, setError] = useState('')
  useEffect(() => { getEducationDistrict(slug).then(setDistrict).catch(e => setError(e.message)) }, [slug])
  const model = useMemo(() => {
    if (!district) return null
    const avg = district.state_averages
    const schoolData = Object.entries(district.school_distribution).map(([name, value]) => ({ name, value }))
    const enrollmentData = Object.entries(district.enrollment_distribution).map(([name, value]) => ({ name, value }))
    const collegeData = Object.entries(district.college_distribution).map(([name, value]) => ({ name, value }))
    const seatData = Object.entries(district.college_seat_distribution).map(([name, seats]) => ({ name, seats })).filter(item => item.seats)
    const literacyData = [{ name: 'Male', rate: district.male_literacy_rate }, { name: 'Female', rate: district.female_literacy_rate }, { name: 'District', rate: district.literacy_rate }, { name: 'Telangana avg.', rate: avg.literacy_rate }]
    const badges = [
      district.ranks.literacy <= 5 && 'Top literacy performer',
      district.total_enrollment >= avg.total_enrollment && 'High enrollment reach',
      district.total_schools >= avg.total_schools && 'Strong school network',
      district.engineering_college_seats > 0 && 'Engineering pathway',
    ].filter(Boolean)
    if (!badges.length) badges.push('Reporting district')
    const literacyGap = district.male_literacy_rate - district.female_literacy_rate
    const recommendations = [
      literacyGap >= 10 && `Prioritize female literacy programmes: the current gender gap is ${literacyGap.toFixed(2)} percentage points.`,
      district.total_colleges < avg.total_colleges && 'Increase local higher-education access through new or strengthened college capacity.',
      district.engineering_college_seats === 0 && 'Assess demand for technical and engineering pathways in the district.',
      district.total_enrollment / Math.max(district.total_schools, 1) > avg.total_enrollment / Math.max(avg.total_schools, 1) && 'Review school capacity where enrollment per school is above the Telangana reporting-district average.',
    ].filter(Boolean)
    if (!recommendations.length) recommendations.push('Maintain current literacy and infrastructure programmes while monitoring district-level trends.')
    const summary = `${district.name} has an education score of ${district.education_score}/100 (${scoreLabel(district.education_score)}). It ranks #${district.ranks.literacy} of ${district.district_count} reporting districts for literacy, with ${format(district.total_enrollment)} students across ${format(district.total_schools)} schools. ${district.total_colleges >= avg.total_colleges ? 'Its college network is above the reporting-district average.' : 'Its college network is below the reporting-district average.'}`
    return { avg, schoolData, enrollmentData, collegeData, seatData, literacyData, badges, recommendations, summary }
  }, [district])
  if (!district && !error) return <div className="loading">Loading district education analytics…</div>
  if (error) return <div className="notice">{error}</div>
  const comparisons = [['Literacy', district.literacy_rate, model.avg.literacy_rate, '%'], ['Schools', district.total_schools, model.avg.total_schools, ''], ['Enrollment', district.total_enrollment, model.avg.total_enrollment, ''], ['Colleges', district.total_colleges, model.avg.total_colleges, ''], ['Engineering seats', district.engineering_college_seats, model.avg.engineering_college_seats, '']]
  return <div className="education-district">
    <Link className="back-link" to="/education">← Education dashboard</Link>
    <section className="district-profile-hero"><div className="district-profile-art" aria-hidden="true"><span>✦</span><i/><i/><i/></div><div className="district-profile-copy"><p className="eyebrow">Education profile · Telangana · State literacy rank #{district.ranks.literacy}</p><h1>{district.name}</h1><h2>District Education Profile</h2><p>Integrated literacy, school infrastructure, enrollment and college-capacity analytics based on the supplied government datasets.</p><div className="achievement-badges">{model.badges.map(badge => <span key={badge}>✦ {badge}</span>)}</div></div><div className="education-score"><span>Education score</span><strong>{district.education_score}</strong><small>out of 100</small><b>{scoreLabel(district.education_score)}</b></div></section>
    <section className="kpis kpis-six education-kpis district-kpis"><article><span>Male literacy</span><strong>{district.male_literacy_rate.toFixed(2)}%</strong><small>{format(district.male_literate)} literate males</small></article><article><span>Female literacy</span><strong>{district.female_literacy_rate.toFixed(2)}%</strong><small>{format(district.female_literate)} literate females</small></article><article><span>Total schools</span><strong>{format(district.total_schools)}</strong><small>All reported school types</small></article><article><span>Total enrollment</span><strong>{format(district.total_enrollment)}</strong><small>School enrollment</small></article><article><span>Engineering colleges</span><strong>{format(district.engineering_colleges)}</strong><small>{format(district.engineering_college_seats)} available seats</small></article><article><span>State rank</span><strong>#{district.ranks.literacy}</strong><small>By literacy rate</small></article></section>
    <section className="district-ranks"><article><span>Literacy rank</span><strong>#{district.ranks.literacy}</strong><small>of {district.district_count} reporting districts</small></article><article><span>Enrollment rank</span><strong>#{district.ranks.enrollment}</strong><small>of {district.district_count} reporting districts</small></article><article><span>College rank</span><strong>#{district.ranks.colleges}</strong><small>of {district.district_count} reporting districts</small></article></section>
    <section className="district-chart-grid"><ChartCard title="School distribution"><Donut data={model.schoolData}/></ChartCard><ChartCard title="Enrollment distribution"><Column data={model.enrollmentData} valueKey="value" colour="#f59e0b"/></ChartCard><ChartCard title="College distribution"><Donut data={model.collegeData}/></ChartCard><ChartCard title="College seats"><Column data={model.seatData} valueKey="seats" colour="#9d5ce6"/></ChartCard><ChartCard title="Literacy comparison" className="literacy-comparison"><Column data={model.literacyData} valueKey="rate" colour="#ec4899" percent/></ChartCard></section>
    <section className="district-insight-grid"><ChartCard title="Compare with Telangana average"><div className="comparison-bars">{comparisons.map(([label, value, average, suffix]) => { const width = Math.min((value / Math.max(average * 2, 1)) * 100, 100); return <div key={label}><p><span>{label}</span><b>{suffix ? `${value.toFixed(2)}${suffix}` : format(value)}</b></p><div className="comparison-track"><i style={{ width: `${width}%` }}/><em style={{ left: `${Math.min((average / Math.max(average * 2, 1)) * 100, 100)}%` }}/></div><small>Telangana reporting-district average: {suffix ? `${average.toFixed(2)}${suffix}` : format(average)}</small></div> })}</div></ChartCard><ChartCard title="AI-style district summary"><p className="district-summary">{model.summary}</p><div className="score-method"><b>How the score is calculated</b><span>Literacy 40% · Schools 15% · Enrollment 20% · Colleges 15% · Engineering seats 10%</span></div></ChartCard><ChartCard title="Smart recommendations"><ul className="recommendations">{model.recommendations.map(recommendation => <li key={recommendation}><i>→</i>{recommendation}</li>)}</ul></ChartCard></section>
  </div>
}
