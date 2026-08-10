import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { getEvStations } from '../api';
import '../ev-dashboard.css';

const PAGE_SIZE = 10;
const colors = ['#2563eb', '#7c3aed', '#0891b2', '#f59e0b', '#10b981', '#ec4899'];
const countBy = (items, key) => Object.entries(items.reduce((counts, item) => { const value = item[key] || 'Not listed'; counts[value] = (counts[value] || 0) + 1; return counts; }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

export default function EVStations() {
  const [stations, setStations] = useState([]);
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [operator, setOperator] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => { getEvStations().then(setStations).catch((err) => setError(err.message)); }, []);
  const districts = useMemo(() => [...new Set(stations.map((station) => station.district).filter(Boolean))].sort(), [stations]);
  const operators = useMemo(() => [...new Set(stations.map((station) => station.owner_organization).filter(Boolean))].sort(), [stations]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return stations.filter((station) => (!search || `${station.name || ''} ${station.address || ''}`.toLowerCase().includes(search)) && (!district || station.district === district) && (!operator || station.owner_organization === operator)).sort((first, second) => {
      const firstValue = String(first[sortBy] || '').toLowerCase(), secondValue = String(second[sortBy] || '').toLowerCase();
      return firstValue.localeCompare(secondValue) * (sortDirection === 'asc' ? 1 : -1);
    });
  }, [stations, query, district, operator, sortBy, sortDirection]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const districtChart = useMemo(() => countBy(filtered, 'district').slice(0, 8), [filtered]);
  const operatorChart = useMemo(() => countBy(filtered, 'owner_organization').slice(0, 6), [filtered]);
  const updateFilters = (callback) => { callback(); setPage(1); };
  const setSorting = (key) => { if (sortBy === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDirection('asc'); } setPage(1); };

  if (error) return <div className="ev-empty">{error} Start Django and refresh the page to load the station directory.</div>;
  return <div className="stations-page">
    <section className="stations-hero"><div><p className="eyebrow">EV infrastructure · station directory</p><h1>Charging stations</h1><p>Search the complete Telangana charging-station directory, compare coverage, and open each station’s full record.</p></div></section>
    <section className="stations-kpi"><article><span>Total stations</span><strong>{stations.length}</strong><small>All imported charging records</small></article><article><span>Matching results</span><strong>{filtered.length}</strong><small>Based on your current filters</small></article><article><span>Districts covered</span><strong>{districts.length}</strong><small>Locations in the source dataset</small></article><article><span>Operators</span><strong>{operators.length}</strong><small>Charging-network organizations</small></article></section>
    <section className="stations-charts"><article><div><p className="eyebrow">Coverage pattern</p><h2>Stations by district</h2></div><div className="stations-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={districtChart} margin={{ left: -18, right: 4 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} /><YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></article><article><div><p className="eyebrow">Network mix</p><h2>Operator distribution</h2></div><div className="stations-pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={operatorChart} dataKey="count" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={3}>{operatorChart.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="stations-operator-key">{operatorChart.map((item, index) => <span key={item.name}><i style={{ background: colors[index % colors.length] }} />{item.name} <b>{item.count}</b></span>)}</div></div></article></section>
    <section className="stations-directory"><div className="stations-directory-heading"><div><p className="eyebrow">All station records</p><h2>Searchable charging-station directory</h2></div><span>Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span></div><div className="stations-filters"><input value={query} onChange={(event) => updateFilters(() => setQuery(event.target.value))} placeholder="Search station name or address" /><select value={district} onChange={(event) => updateFilters(() => setDistrict(event.target.value))}><option value="">All districts</option>{districts.map((name) => <option key={name}>{name}</option>)}</select><select value={operator} onChange={(event) => updateFilters(() => setOperator(event.target.value))}><option value="">All operators</option>{operators.map((name) => <option key={name}>{name}</option>)}</select><select value={`${sortBy}:${sortDirection}`} onChange={(event) => { const [key, direction] = event.target.value.split(':'); setSortBy(key); setSortDirection(direction); setPage(1); }}><option value="name:asc">Station name A–Z</option><option value="name:desc">Station name Z–A</option><option value="district:asc">District A–Z</option><option value="owner_organization:asc">Operator A–Z</option></select></div><div className="stations-table-wrap"><table className="stations-table"><thead><tr>{[['name', 'Station'], ['district', 'District'], ['owner_organization', 'Operator'], ['address', 'Address']].map(([key, label]) => <th key={key}><button type="button" onClick={() => setSorting(key)}>{label}{sortBy === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</button></th>)}<th>Action</th></tr></thead><tbody>{rows.map((station) => <tr key={station.id}><td data-label="Station"><b>{station.name}</b></td><td data-label="District">{station.district || '—'}</td><td data-label="Operator">{station.owner_organization || '—'}</td><td data-label="Address">{station.address || 'Address unavailable'}</td><td data-label="Action"><Link to={`/ev/stations/${station.slug}`}>View details →</Link></td></tr>)}</tbody></table>{!rows.length && <div className="ev-empty">No stations match the selected search and filters.</div>}</div><footer className="stations-pagination"><span>Page {page} of {pageCount}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>← Previous</button><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next →</button></div></footer></section>
  </div>;
}
