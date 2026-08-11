import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getEvOverview, getEvStations } from '../api';
import '../ev-dashboard.css';

const chartColors = ['#2563eb', '#7c3aed', '#f59e0b', '#ec4899', '#10b981', '#0ea5e9'];
const format = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);
const chartStyle = { borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15,23,42,0.06)' };

export default function EVOverview() {
  const [overview, setOverview] = useState(null);
  const [stations, setStations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getEvOverview(), getEvStations()])
      .then(([overviewData, stationData]) => {
        setOverview(overviewData);
        setStations(stationData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const districtChart = overview?.districts || [];
  const operatorChart = overview?.owners || [];
  const hyderabadCount = useMemo(() => stations.filter((station) => (station.district || '').toLowerCase().includes('hyderabad')).length, [stations]);
  const outsideHyderabadCount = stations.length - hyderabadCount;
  const recentStations = useMemo(() => [...stations].slice(0, 6), [stations]);
  const quickLinks = [
    { title: 'Interactive Map', description: 'Explore stations by district and cluster.', to: '/ev/map' },
    { title: 'Nearby EV Stations', description: 'Find charging points around your current location.', to: '/ev/nearby' },
    { title: 'Charging Stations', description: 'Search and filter the full station inventory.', to: '/ev/stations' },
    { title: 'District Analytics', description: 'See coverage by district at a glance.', to: '/ev' },
    { title: 'Operator Analytics', description: 'Compare major operators and fleets.', to: '/ev' },
    { title: 'Compare Districts', description: 'Line up district-level EV coverage.', to: '/ev' },
    { title: 'Route Planner', description: 'Plan a drive and find charging stops along the way.', to: '/ev/route-planner' },
  ];

  if (!overview && !error) {
    return <div className="ev-empty">Loading EV infrastructure dashboard</div>;
  }

  if (error) {
    return <div className="ev-empty">{error} Start Django and refresh the page to load the EV dataset.</div>;
  }

  return (
    <div className="ev-dashboard ev-dashboard-page">
      <section className="ev-hero">
        <div>
          <p className="eyebrow">Home · EV infrastructure</p>
          <h1>EV charging infrastructure dashboard</h1>
          <p>Track Telangana's EV charging network with the same polished dashboard language used for demographics and education analytics.</p>
        </div>
        <div className="ev-hero-mark">
          <span>⚡</span>
          <b>Public and private charging access, mapped for quick insight</b>
        </div>
      </section>

      <section className="ev-kpis">
        <article><span>Total charging stations</span><strong>{format(overview.station_count)}</strong><small>Across the supplied April 2024 dataset</small></article>
        <article><span>Total districts covered</span><strong>{format(overview.district_count)}</strong><small>Districts with EV station records</small></article>
        <article><span>Total operators</span><strong>{format(overview.owner_count)}</strong><small>Organizations and service providers</small></article>
        <article><span>Stations in Hyderabad</span><strong>{format(hyderabadCount)}</strong><small>Hyderabad-based charging points</small></article>
        <article><span>Stations outside Hyderabad</span><strong>{format(outsideHyderabadCount)}</strong><small>Coverage beyond the city core</small></article>
      </section>

      <section className="ev-grid">
        <article className="ev-chart-card">
          <h3>Stations by district</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChart}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={format} contentStyle={chartStyle} />
                <Bar dataKey="station_count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ev-chart-card">
          <h3>Top operators</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorChart} layout="vertical" margin={{ left: 10, right: 8 }}>
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={format} contentStyle={chartStyle} />
                <Bar dataKey="station_count" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="ev-card-row">
        <article className="ev-chart-card">
          <h3>Operator share</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={operatorChart} dataKey="station_count" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={2}>
                  {operatorChart.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={format} contentStyle={chartStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ev-chart-card">
          <h3>Recent statistics</h3>
          <div className="ev-summary-grid">
            <article><span>Latest stations</span><strong>{recentStations.length}</strong><small>Most recently loaded records</small></article>
            <article><span>District concentration</span><strong>{districtChart[0]?.name || '—'}</strong><small>Highest station count district</small></article>
            <article><span>Leading operator</span><strong>{operatorChart[0]?.name || '—'}</strong><small>Largest operator footprint</small></article>
            <article><span>Coverage mix</span><strong>{hyderabadCount > outsideHyderabadCount ? 'Hyderabad-heavy' : 'Balanced'}</strong><small>City vs regional distribution</small></article>
          </div>
          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr><th>Station</th><th>District</th><th>Operator</th></tr>
              </thead>
              <tbody>
                {recentStations.map((station) => (
                  <tr key={station.id}>
                    <td>{station.name}</td>
                    <td>{station.district || '—'}</td>
                    <td>{station.owner_organization || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="ev-chart-card" style={{ marginTop: 16 }}>
        <h3>Quick navigation</h3>
        <div className="ev-nav-grid">
          {quickLinks.map((item) => (
            <Link key={item.title} to={item.to} className="ev-nav-card">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
