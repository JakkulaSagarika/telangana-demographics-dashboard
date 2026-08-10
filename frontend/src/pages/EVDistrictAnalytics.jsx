import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getEvOverview, getEvStations } from '../api';
import '../ev-dashboard.css';

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slugify = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const colors = ['#2563eb', '#7c3aed', '#f59e0b', '#ec4899', '#10b981', '#0ea5e9'];
const stationPin = L.divIcon({ className: 'district-station-pin', html: '<span>⚡</span>', iconSize: [28, 28], iconAnchor: [14, 14] });

function DistrictMapFocus({ stations }) {
  const map = useMap();
  useEffect(() => {
    if (!stations.length) return;
    const points = stations.map((station) => [Number(station.latitude), Number(station.longitude)]);
    if (points.length === 1) map.setView(points[0], 12);
    else map.fitBounds(points, { padding: [30, 30], maxZoom: 12 });
  }, [map, stations]);
  return null;
}

const countBy = (items, key) => Object.entries(items.reduce((result, item) => { const value = item[key] || 'Not listed'; result[value] = (result[value] || 0) + 1; return result; }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

export default function EVDistrictAnalytics() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [overview, setOverview] = useState(null);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { Promise.all([getEvOverview(), getEvStations()]).then(([summary, data]) => { setOverview(summary); setStations(data); }).catch((err) => setError(err.message)); }, []);
  const districts = useMemo(() => [...new Set(stations.map((station) => station.district).filter(Boolean))].sort(), [stations]);
  const districtStations = useMemo(() => stations.filter((station) => normalize(station.district) === normalize(slug?.replace(/-/g, ' '))), [stations, slug]);
  const districtName = districtStations[0]?.district || districts.find((name) => slugify(name) === slug) || slug?.replace(/-/g, ' ') || 'District';
  useEffect(() => { setSearchDistrict(districtName); }, [districtName]);
  const operatorBreakdown = useMemo(() => countBy(districtStations, 'owner_organization'), [districtStations]);
  const topOperator = operatorBreakdown[0];
  const telanganaAverage = overview ? overview.station_count / Math.max(overview.district_count, 1) : 0;
  const districtDistribution = useMemo(() => countBy(stations, 'district'), [stations]);
  const rank = districtDistribution.findIndex((item) => item.name === districtName) + 1;
  const filteredStations = useMemo(() => { const search = query.toLowerCase().trim(); return !search ? districtStations : districtStations.filter((station) => `${station.name || ''} ${station.owner_organization || ''} ${station.address || ''}`.toLowerCase().includes(search)); }, [districtStations, query]);
  const mappedStations = useMemo(() => districtStations.filter((station) => Number(station.latitude) && Number(station.longitude)).map((station) => ({ ...station, latitude: Number(station.latitude), longitude: Number(station.longitude) })), [districtStations]);
  const stationDistribution = operatorBreakdown.slice(0, 6);

  const chooseDistrict = (value) => { setSearchDistrict(value); const match = districts.find((name) => name.toLowerCase() === value.toLowerCase()); if (match) navigate(`/ev/districts/${slugify(match)}`); };
  if (error) return <div className="ev-empty">{error}</div>;

  return <div className="district-ev-page">
    <section className="district-ev-hero"><div><p className="eyebrow">EV infrastructure · district analytics</p><h1>{districtName}</h1><p>Explore charging coverage, operator presence, and each recorded station within this Telangana district.</p></div><Link to="/ev/map" className="district-ev-back">← Interactive map</Link></section>
    <section className="district-ev-selector"><label><span>Select or search a district</span><input list="ev-districts" value={searchDistrict} onChange={(event) => chooseDistrict(event.target.value)} placeholder="Search Telangana district" /><datalist id="ev-districts">{districts.map((name) => <option key={name} value={name} />)}</datalist></label><p>Choose a district to refresh its charging-station analysis.</p></section>
    <section className="district-ev-kpis"><article><span>Total charging stations</span><strong>{districtStations.length}</strong><small>Recorded in {districtName}</small></article><article><span>Operators</span><strong>{operatorBreakdown.length}</strong><small>Distinct charging organizations</small></article><article><span>Top operator</span><strong>{topOperator?.name || '—'}</strong><small>{topOperator ? `${topOperator.count} station${topOperator.count === 1 ? '' : 's'} in district` : 'No operator data'}</small></article><article><span>State average comparison</span><strong>{telanganaAverage ? `${(districtStations.length / telanganaAverage).toFixed(1)}×` : '—'}</strong><small>District has {districtStations.length >= telanganaAverage ? 'more' : 'fewer'} stations than state average</small></article></section>
    <section className="district-ev-grid"><article className="district-ev-card"><div className="district-ev-heading"><div><p className="eyebrow">Station distribution</p><h2>District vs state average</h2></div><span>Rank #{rank || '—'}</span></div><div className="district-ev-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: districtName, stations: districtStations.length }, { name: 'State average', stations: Number(telanganaAverage.toFixed(1)) }]}><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="stations" radius={[7, 7, 0, 0]}>{[0, 1].map((item) => <Cell key={item} fill={item ? '#93c5fd' : '#2563eb'} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className="district-ev-card"><div className="district-ev-heading"><div><p className="eyebrow">Operator distribution</p><h2>Who runs the stations?</h2></div></div><div className="district-ev-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stationDistribution.length ? stationDistribution : [{ name: 'No data', count: 1 }]} dataKey="count" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3}>{(stationDistribution.length ? stationDistribution : [{ name: 'No data' }]).map((item, index) => <Cell key={item.name} fill={stationDistribution.length ? colors[index % colors.length] : '#cbd5e1'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div>{stationDistribution.map((item, index) => <span key={item.name}><i style={{ background: colors[index % colors.length] }} />{item.name}<b>{item.count}</b></span>)}</div></div></article></section>
    <section className="district-ev-map-card"><div className="district-ev-heading"><div><p className="eyebrow">District map</p><h2>Charging-station locations</h2></div><span>{mappedStations.length} mapped</span></div><MapContainer className="district-ev-map" center={[17.385, 78.4867]} zoom={8} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><DistrictMapFocus stations={mappedStations} />{mappedStations.map((station) => <Marker key={station.id} position={[station.latitude, station.longitude]} icon={stationPin} eventHandlers={{ click: () => navigate(`/ev/stations/${station.slug}`) }}><Popup><Link to={`/ev/stations/${station.slug}`}><strong>{station.name}</strong><br />View station details →</Link></Popup></Marker>)}</MapContainer></section>
    <section className="district-ev-table-card"><div className="district-ev-table-heading"><div><p className="eyebrow">Station inventory</p><h2>All charging stations in {districtName}</h2></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, operator or address" /></div><div className="district-ev-table-wrap"><table><thead><tr><th>Station</th><th>Operator</th><th>Address</th><th>Coordinates</th><th>Action</th></tr></thead><tbody>{filteredStations.map((station) => <tr key={station.id}><td data-label="Station"><b>{station.name}</b></td><td data-label="Operator">{station.owner_organization || '—'}</td><td data-label="Address">{station.address || '—'}</td><td data-label="Coordinates">{station.latitude && station.longitude ? `${Number(station.latitude).toFixed(4)}, ${Number(station.longitude).toFixed(4)}` : '—'}</td><td data-label="Action"><Link to={`/ev/stations/${station.slug}`}>View details →</Link></td></tr>)}</tbody></table>{!filteredStations.length && <div className="ev-empty">No station records match this search.</div>}</div></section>
  </div>;
}
