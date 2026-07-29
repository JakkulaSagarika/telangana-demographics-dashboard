import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { getEducationOverview } from '../api'
import DistrictCombobox from '../components/DistrictCombobox'
import EducationMap from '../components/EducationMap'
import '../education-dashboard.css'

const format = value => new Intl.NumberFormat('en-IN').format(value || 0)
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' }
const distributionColors = ['#e4d3fa', '#c8a8f0', '#a876df', '#7b4bc7', '#4a268f']
const mapLayers = [['literacy', 'Overall'], ['maleLiteracy', 'Male'], ['femaleLiteracy', 'Female']]

function pearson(items) {
  if (items.length < 2) return 0
  const meanX = items.reduce((sum, item) => sum + item.literacy_rate, 0) / items.length
  const meanY = items.reduce((sum, item) => sum + item.total_enrollment, 0) / items.length
  const numerator = items.reduce((sum, item) => sum + (item.literacy_rate - meanX) * (item.total_enrollment - meanY), 0)
  const denominator = Math.sqrt(
    items.reduce((sum, item) => sum + (item.literacy_rate - meanX) ** 2, 0)
    * items.reduce((sum, item) => sum + (item.total_enrollment - meanY) ** 2, 0),
  )
  return denominator ? numerator / denominator : 0
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export default function LiteracyAnalytics() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const [districtSlug, setDistrictSlug] = useState('')
  const [search, setSearch] = useState('')
  const [mapLayer, setMapLayer] = useState('literacy')
  const [sortBy, setSortBy] = useState('literacy_rate')
  const navigate = useNavigate()

  useEffect(() => {
    getEducationOverview().then(setOverview).catch(e => setError(e.message))
  }, [])

  const districts = overview?.districts || []

  const visible = useMemo(
    () => districts.filter(
      district => (!districtSlug || district.slug === districtSlug)
        && district.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [districts, districtSlug, search],
  )

  const sorted = useMemo(
    () => [...visible].sort((a, b) => b.literacy_rate - a.literacy_rate),
    [visible],
  )

  const tableRows = useMemo(
    () => [...visible].sort((a, b) => {
      if (sortBy === 'gender_gap') return (b.male_literacy_rate - b.female_literacy_rate) - (a.male_literacy_rate - a.female_literacy_rate)
      if (sortBy === 'total_enrollment') return b.total_enrollment - a.total_enrollment
      return b.literacy_rate - a.literacy_rate
    }),
    [visible, sortBy],
  )

  const gaps = useMemo(
    () => sorted.map(district => ({
      ...district,
      gender_gap: Number((district.male_literacy_rate - district.female_literacy_rate).toFixed(2)),
    })),
    [sorted],
  )

  const bins = useMemo(
    () => [[0, 49.99], [50, 59.99], [60, 69.99], [70, 79.99], [80, 100]].map(([low, high]) => ({
      name: `${low.toFixed(0)}–${high === 100 ? 100 : high.toFixed(0)}%`,
      value: sorted.filter(d => d.literacy_rate >= low && d.literacy_rate <= high).length,
    })),
    [sorted],
  )

  const correlation = pearson(visible)
  const average = visible.reduce((sum, district) => sum + district.literacy_rate, 0) / Math.max(visible.length, 1)
  const avgGap = gaps.reduce((sum, district) => sum + district.gender_gap, 0) / Math.max(gaps.length, 1)
  const highest = sorted.slice(0, 5)
  const lowest = sorted.slice(-5).reverse()
  const trendData = [...sorted].reverse()

  const exportCsv = () => {
    const header = ['District', 'Overall Literacy', 'Male Literacy', 'Female Literacy', 'Gender Gap', 'Enrollment', 'State Rank']
    const rows = gaps.map(d => [
      d.name, d.literacy_rate, d.male_literacy_rate, d.female_literacy_rate,
      d.gender_gap, d.total_enrollment, d.state_rank,
    ])
    const content = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'telangana-literacy-analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!overview && !error) return <div className="loading">Loading literacy analytics…</div>
  if (error) return <div className="notice">{error}</div>

  return (
    <div className="literacy-analytics">
      <section className="literacy-heading">
        <div>
          <p className="eyebrow">Education analytics · literacy</p>
          <h1>Literacy analytics</h1>
          <p>Explore district literacy rates, gender gaps, and the relationship between literacy and student enrollment across Telangana.</p>
        </div>
        <div className="literacy-total">
          <span>Average literacy</span>
          <strong>{average.toFixed(2)}%</strong>
          <small>{visible.length} reporting districts</small>
        </div>
      </section>

      <section className="literacy-kpis">
        <article>
          <span>Highest literacy</span>
          <strong>{highest[0]?.name || '—'}</strong>
          <b>{highest[0]?.literacy_rate.toFixed(2) || 0}%</b>
        </article>
        <article>
          <span>Lowest literacy</span>
          <strong>{lowest[0]?.name || '—'}</strong>
          <b>{lowest[0]?.literacy_rate.toFixed(2) || 0}%</b>
        </article>
        <article>
          <span>Average gender gap</span>
          <strong>{avgGap.toFixed(2)} pts</strong>
          <b>Male – female literacy</b>
        </article>
        <article>
          <span>Literacy · enrollment correlation</span>
          <strong>{correlation.toFixed(2)}</strong>
          <b>{correlation >= 0.3 ? 'Positive association' : correlation <= -0.3 ? 'Negative association' : 'Weak association'}</b>
        </article>
      </section>

      <section className="literacy-filters">
        <DistrictCombobox districts={districts} value={districtSlug} onChange={setDistrictSlug} label="Filter district" />
        <label>
          Search within results
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter displayed districts" />
        </label>
        <label>
          Sort table by
          <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option value="literacy_rate">Overall literacy</option>
            <option value="gender_gap">Gender gap</option>
            <option value="total_enrollment">Enrollment</option>
          </select>
        </label>
        <button type="button" onClick={exportCsv}>↓ Export CSV</button>
      </section>

      <section className="literacy-map-section">
        <article className="education-map-card">
          <div className="map-card-heading">
            <div>
              <h2>Interactive literacy map</h2>
              <p>Choose a layer, hover for district rates and enrollment, or click a district for its full profile.</p>
            </div>
            <div className="education-layer-pills">
              {mapLayers.map(([key, label]) => (
                <button key={key} type="button" className={mapLayer === key ? 'active' : ''} onClick={() => setMapLayer(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <EducationMap districts={visible} layer={mapLayer} />
        </article>
        <article className="education-chart-card">
          <h3>Literacy distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bins}>
              <CartesianGrid vertical={false} stroke="#eee6dc" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={value => `${value} districts`} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {bins.map((item, index) => <Cell key={item.name} fill={distributionColors[index]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="literacy-chart-grid">
        <article className="education-chart-card">
          <h3>Male vs female literacy</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={sorted.slice(0, 10)} margin={{ left: -20, right: 4 }}>
              <CartesianGrid vertical={false} stroke="#eee6dc" />
              <XAxis dataKey="name" tickFormatter={value => value.split(' ')[0]} tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={value => `${value}%`} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={value => `${value.toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="male_literacy_rate" name="Male" fill="#6c3cf0" radius={[5, 5, 0, 0]} />
              <Bar dataKey="female_literacy_rate" name="Female" fill="#ec4899" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="education-chart-card">
          <h3>Gender gap by district</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={[...gaps].sort((a, b) => b.gender_gap - a.gender_gap).slice(0, 10)}
              layout="vertical"
              margin={{ left: 6, right: 10 }}
            >
              <CartesianGrid horizontal={false} stroke="#eee6dc" />
              <XAxis type="number" tickFormatter={value => `${value} pts`} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={value => `${value.toFixed(2)} points`} />
              <Bar dataKey="gender_gap" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="education-chart-card">
          <h3>Literacy and enrollment correlation</h3>
          <ResponsiveContainer width="100%" height={290}>
            <ScatterChart margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="#eee6dc" />
              <XAxis type="number" dataKey="literacy_rate" name="Literacy" unit="%" tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey="total_enrollment" name="Enrollment" tickFormatter={value => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10 }} />
              <ZAxis range={[60, 200]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} formatter={format} />
              <Scatter
                data={visible}
                fill="#6c3cf0"
                onClick={district => district?.slug && navigate(`/education/districts/${district.slug}`)}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="correlation-note">
            Pearson correlation: <b>{correlation.toFixed(2)}</b>. Each point is a reporting district; click a point to open its profile.
          </p>
        </article>
      </section>

      <section className="literacy-trend-card">
        <div>
          <h2>Literacy trends across districts</h2>
          <p>
            The dataset contains one literacy observation per district, so this view ranks districts from lowest to highest
            and plots male, female, and overall rates side by side — not an invented time series.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
            <CartesianGrid vertical={false} stroke="#eee6dc" />
            <XAxis dataKey="name" tickFormatter={value => value.split(' ')[0]} tick={{ fontSize: 9 }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={value => `${value}%`} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={value => `${value.toFixed(2)}%`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="literacy_rate" name="Overall" stroke="#6c3cf0" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="male_literacy_rate" name="Male" stroke="#4e9ce6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="female_literacy_rate" name="Female" stroke="#ec4899" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="literacy-rankings">
        <article className="education-chart-card">
          <h3>Highest literacy districts</h3>
          {highest.map((district, index) => (
            <button type="button" key={district.slug} onClick={() => navigate(`/education/districts/${district.slug}`)}>
              <span>#{index + 1}</span>
              <b>{district.name}</b>
              <em>{district.literacy_rate.toFixed(2)}%</em>
            </button>
          ))}
        </article>
        <article className="education-chart-card">
          <h3>Lowest literacy districts</h3>
          {lowest.map(district => (
            <button type="button" key={district.slug} onClick={() => navigate(`/education/districts/${district.slug}`)}>
              <span>#{district.state_rank}</span>
              <b>{district.name}</b>
              <em>{district.literacy_rate.toFixed(2)}%</em>
            </button>
          ))}
        </article>
      </section>

      <section className="literacy-table-card">
        <div className="literacy-table-title">
          <div>
            <h2>District-wise literacy table</h2>
            <p>Click any district row to open its full education analytics profile.</p>
          </div>
          <span>{tableRows.length} districts shown</span>
        </div>
        <div className="literacy-table-wrap">
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>Overall</th>
                <th>Male</th>
                <th>Female</th>
                <th>Gender gap</th>
                <th>Enrollment</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(district => (
                <tr key={district.slug} onClick={() => navigate(`/education/districts/${district.slug}`)}>
                  <td>
                    <b>{district.name}</b>
                    <small>View district analytics →</small>
                  </td>
                  <td>{district.literacy_rate.toFixed(2)}%</td>
                  <td>{district.male_literacy_rate.toFixed(2)}%</td>
                  <td>{district.female_literacy_rate.toFixed(2)}%</td>
                  <td>{(district.male_literacy_rate - district.female_literacy_rate).toFixed(2)} pts</td>
                  <td>{format(district.total_enrollment)}</td>
                  <td>#{district.state_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
