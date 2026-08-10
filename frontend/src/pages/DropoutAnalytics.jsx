import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getEducationDropout } from '../api';
import DistrictCombobox from '../components/DistrictCombobox';
import EducationMap from '../components/EducationMap';
import '../education-dashboard.css';

const format = (value) => new Intl.NumberFormat('en-IN').format(value || 0);
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee2d6', boxShadow: '0 10px 24px #41206e1f' };
const stages = [
  ['primary', 'Primary', '#6c3cf0'],
  ['upper_primary', 'Upper Primary', '#4e9ce6'],
  ['high_school', 'High School', '#ec4899'],
];

export default function DropoutAnalytics() {
  const [overview, setOverview] = useState(null);
  const [districtSlug, setDistrictSlug] = useState('');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('high_school');
  const [sortBy, setSortBy] = useState('high_school_dropout_rate');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { getEducationDropout().then(setOverview).catch((err) => setError(err.message)); }, []);
  const districts = overview?.districts || [];
  const visible = useMemo(() => districts.filter((district) => (!districtSlug || district.slug === districtSlug) && district.name.toLowerCase().includes(search.toLowerCase())), [districts, districtSlug, search]);
  const ranked = useMemo(() => [...visible].sort((a, b) => b.high_school_dropout_rate - a.high_school_dropout_rate), [visible]);
  const tableRows = useMemo(() => [...visible].sort((a, b) => Number(b[sortBy] ?? -Infinity) - Number(a[sortBy] ?? -Infinity)), [visible, sortBy]);
  const selectedStage = stages.find(([key]) => key === stage) || stages[2];
  const countComparison = stages.map(([key, label, color]) => ({ name: label, value: overview?.[`estimated_${key}_dropouts`] || 0, color }));
  const topRate = ranked.slice(0, 10);
  const rankLeaders = ranked.slice(0, 5);

  if (!overview && !error) return <div className="loading">Loading dropout analytics…</div>;
  if (error) return <div className="notice">{error}</div>;

  return <div className="dropout-analytics">
    <section className="dropout-heading"><div><p className="eyebrow">Education analytics · 2021–22</p><h1>Dropout analytics</h1><p>District-level primary, upper-primary and high-school dropout measures from the supplied Telangana 2021–22 CSV.</p></div><div className="dropout-total"><span>Reporting districts</span><strong>{overview.district_count}</strong><small>{overview.districts[0]?.data_year || '2021–22'} data</small></div></section>
    <section className="dropout-kpis">{stages.map(([key, label, color]) => <article key={`${key}-count`}><i style={{ background: color }} /><span>{label} dropout count</span><strong>{format(overview[`estimated_${key}_dropouts`])}</strong><small>Reported estimated count</small></article>)}{stages.map(([key, label, color]) => <article key={`${key}-rate`}><i style={{ background: color }} /><span>{label} dropout rate</span><strong>{overview[`${key}_dropout_rate`].toFixed(2)}%</strong><small>Average across reporting districts</small></article>)}</section>
    <section className="dropout-filters"><DistrictCombobox districts={districts} value={districtSlug} onChange={setDistrictSlug} label="Filter district" /><label>Search districts<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search displayed districts" /></label><label>Rank table by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="high_school_dropout_rate">High school dropout rate</option><option value="upper_primary_dropout_rate">Upper primary dropout rate</option><option value="primary_dropout_rate">Primary dropout rate</option><option value="estimated_high_school_dropouts">High school dropout count</option></select></label></section>
    <section className="dropout-map-section"><article className="education-map-card"><div className="map-card-heading"><div><h2>District dropout-rate map</h2><p>High-school dropout rate is mapped by district. Click a district to open its existing education profile.</p></div><div className="education-layer-pills"><button type="button" className="active">High school rate</button></div></div><EducationMap districts={visible} layer="dropoutRate" /></article><article className="education-chart-card"><h3>District-wise dropout rate</h3><p className="dropout-card-copy">High school stage · top 10 reporting districts</p><ResponsiveContainer width="100%" height={300}><BarChart data={topRate} layout="vertical" margin={{ left: 12, right: 10 }}><CartesianGrid horizontal={false} stroke="#eee6dc" /><XAxis type="number" unit="%" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" width={105} tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value.toFixed(2)}%`, 'High school dropout rate']} /><Bar dataKey="high_school_dropout_rate" name="High School" fill="#ec4899" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></article></section>
    <section className="dropout-chart-grid"><article className="education-chart-card"><h3>Stage-wise dropout counts</h3><p className="dropout-card-copy">Summed reported estimates. Blank CSV estimates are not treated as zero.</p><ResponsiveContainer width="100%" height={280}><BarChart data={countComparison}><CartesianGrid vertical={false} stroke="#eee6dc" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [format(value), 'Reported estimated dropouts']} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{countComparison.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></article><article className="education-chart-card"><h3>Stage comparison by district</h3><p className="dropout-card-copy">{selectedStage[1]} rate · choose a stage</p><div className="dropout-stage-pills">{stages.map(([key, label, color]) => <button key={key} type="button" className={stage === key ? 'active' : ''} style={{ '--stage-color': color }} onClick={() => setStage(key)}>{label}</button>)}</div><ResponsiveContainer width="100%" height={240}><BarChart data={[...visible].sort((a, b) => b[`${stage}_dropout_rate`] - a[`${stage}_dropout_rate`]).slice(0, 10)}><CartesianGrid vertical={false} stroke="#eee6dc" /><XAxis dataKey="name" tickFormatter={(value) => value.split(' ')[0]} tick={{ fontSize: 9 }} /><YAxis unit="%" tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value.toFixed(2)}%`, `${selectedStage[1]} dropout rate`]} /><Bar dataKey={`${stage}_dropout_rate`} fill={selectedStage[2]} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></article><article className="education-chart-card"><h3>Highest dropout-rate districts</h3><p className="dropout-card-copy">Ranked by high-school dropout rate</p><div className="dropout-ranking">{rankLeaders.map((district) => <button key={district.slug} type="button" onClick={() => navigate(`/education/districts/${district.slug}`)}><span>#{district.dropout_rank}</span><b>{district.name}</b><em>{district.high_school_dropout_rate.toFixed(2)}%</em></button>)}</div></article></section>
    <section className="dropout-table-card"><div className="dropout-table-title"><div><h2>District-wise dropout table</h2><p>Counts are reported estimated values from the uploaded file; rates are the official CSV measure. Click a district for its education profile.</p></div><span>{tableRows.length} districts shown</span></div><div className="dropout-table-wrap"><table><thead><tr><th>District</th><th>Primary count / rate</th><th>Upper primary count / rate</th><th>High school count / rate</th><th>High school rank</th></tr></thead><tbody>{tableRows.map((district) => <tr key={district.slug} onClick={() => navigate(`/education/districts/${district.slug}`)}><td><b>{district.name}</b><small>View district analytics →</small></td>{stages.map(([key]) => <td key={key}>{district[`estimated_${key}_dropouts`] == null ? 'Not reported' : format(district[`estimated_${key}_dropouts`])}<small>{district[`${key}_dropout_rate`].toFixed(2)}%</small></td>)}<td>#{district.dropout_rank}</td></tr>)}</tbody></table></div></section>
  </div>;
}
