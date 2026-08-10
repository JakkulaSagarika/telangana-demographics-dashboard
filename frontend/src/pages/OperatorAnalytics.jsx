import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getEvOverview } from '../api';
import '../ev-dashboard.css';

const colors = [
  '#2563eb',
  '#7c3aed',
  '#f59e0b',
  '#ec4899',
  '#10b981',
  '#0ea5e9',
  '#ef4444',
  '#14b8a6',
];

export default function OperatorAnalytics() {
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getEvOverview()
      .then((data) => setOverview(data))
      .catch((err) => setError(err.message));
  }, []);

  const operators = overview?.owners || [];

  const totalOperators = overview?.owner_count || 0;
  const totalStations = overview?.station_count || 0;

  const largestOperator = useMemo(() => {
    return [...operators].sort(
      (a, b) => b.station_count - a.station_count
    )[0];
  }, [operators]);

  const averageStations =
    totalOperators > 0
      ? (totalStations / totalOperators).toFixed(1)
      : '0';

  /* Search */
  const filteredOperators = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return operators;

    return operators.filter((operator) =>
      operator.name.toLowerCase().includes(query)
    );
  }, [operators, search]);

  /* Top operators */
  const topOperators = useMemo(() => {
    return [...operators]
      .sort((a, b) => b.station_count - a.station_count)
      .slice(0, 10);
  }, [operators]);

  /* Market share
     Show top 7 operators + Other */
  const marketShare = useMemo(() => {
    const sorted = [...operators].sort(
      (a, b) => b.station_count - a.station_count
    );

    const top = sorted.slice(0, 7);

    const otherStations = sorted
      .slice(7)
      .reduce(
        (sum, operator) => sum + operator.station_count,
        0
      );

    const result = top.map((operator) => ({
      name: operator.name,
      value: operator.station_count,
    }));

    if (otherStations > 0) {
      result.push({
        name: 'Other',
        value: otherStations,
      });
    }

    return result;
  }, [operators]);

  /* District coverage */
  const districtCoverage = useMemo(() => {
    return [...operators]
      .sort((a, b) => b.district_count - a.district_count)
      .slice(0, 10)
      .map((operator) => ({
        name: operator.name,
        districts: operator.district_count,
      }));
  }, [operators]);

  if (error) {
    return (
      <div className="ev-empty">
        Unable to load operator analytics: {error}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="ev-empty">
        Loading operator analytics...
      </div>
    );
  }

  return (
    <div className="stations-page">

      {/* HERO */}
      <section className="stations-hero">
        <p className="eyebrow">
          EV infrastructure · operator analytics
        </p>

        <h1>Operator Analytics</h1>

        <p>
          Analyze charging-station operators, market presence,
          and district coverage across Telangana.
        </p>
      </section>


      {/* KPI CARDS */}
      <section className="stations-kpi">

        <article>
          <span>Total Operators</span>
          <strong>{totalOperators}</strong>
          <small>Charging organizations</small>
        </article>

        <article>
          <span>Total Stations</span>
          <strong>{totalStations}</strong>
          <small>Recorded charging stations</small>
        </article>

        <article>
          <span>Largest Operator</span>
          <strong>
            {largestOperator?.name || '—'}
          </strong>
          <small>
            {largestOperator
              ? `${largestOperator.station_count} stations`
              : 'No data'}
          </small>
        </article>

        <article>
          <span>Avg. Stations / Operator</span>
          <strong>{averageStations}</strong>
          <small>Statewide average</small>
        </article>

      </section>


      {/* CHARTS */}
      <section className="stations-charts">

        {/* TOP OPERATORS */}
        <article>
          <h2>Top Operators</h2>

          <p className="nearby-chart-copy">
            Operators with the highest number of charging stations.
          </p>

          <div className="stations-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topOperators}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="station_count"
                  name="Stations"
                  fill="#2563eb"
                  radius={[0, 7, 7, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>


        {/* MARKET SHARE */}
        <article>
          <h2>Operator Market Share</h2>

          <p className="nearby-chart-copy">
            Share of Telangana's charging stations by operator.
          </p>

          <div className="stations-pie-chart">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketShare}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {marketShare.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={
                        item.name === 'Other'
                          ? '#cbd5e1'
                          : colors[index % colors.length]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>


            <div className="stations-operator-key">

              {marketShare.map((item, index) => (
  <span key={item.name}>
    <i
      style={{
        background:
          item.name === 'Other'
            ? '#cbd5e1'
            : colors[index % colors.length],
      }}
    />

    {item.name}

    <b>{item.value}</b>
  </span>
))}

            </div>

          </div>
        </article>

      </section>


      {/* DISTRICT COVERAGE */}
      <section className="stations-charts">

        <article style={{ gridColumn: '1 / -1' }}>
          <h2>District Coverage</h2>

          <p className="nearby-chart-copy">
            Number of Telangana districts covered by each major
            charging operator.
          </p>

          <div className="stations-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtCoverage}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="districts"
                  name="Districts Covered"
                  fill="#7c3aed"
                  radius={[0, 7, 7, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

      </section>


      {/* OPERATOR DIRECTORY */}
      <section className="stations-directory">

        <div className="stations-directory-heading">

          <div>
            <h2>Operator Directory</h2>

            <p className="nearby-chart-copy">
              Search and explore charging station operators.
            </p>
          </div>

          <span>
            {filteredOperators.length} operators
          </span>

        </div>


        {/* SEARCH */}
        <div className="stations-filters">

          <input
            type="text"
            placeholder="Search operator..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        {/* TABLE */}
        <div className="stations-table-wrap">

          <table className="stations-table">

            <thead>
              <tr>
                <th>Operator</th>
                <th>Stations</th>
                <th>Districts Covered</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredOperators.map((operator) => (
                <tr key={operator.name}>

                  <td data-label="Operator">
                    {operator.name}
                  </td>

                  <td data-label="Stations">
                    {operator.station_count}
                  </td>

                  <td data-label="Districts">
                    {operator.district_count}
                  </td>

                  <td data-label="Action">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOperator(operator)
                      }
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      View distribution →
                    </button>
                  </td>

                </tr>
              ))}

              {!filteredOperators.length && (
                <tr>
                  <td
                    colSpan="4"
                    style={{ textAlign: 'center' }}
                  >
                    No operators match your search.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* SELECTED OPERATOR */}
      {selectedOperator && (
        <section
          className="stations-directory"
          style={{ marginTop: '18px' }}
        >

          <div className="stations-directory-heading">

            <div>
              <h2>
                {selectedOperator.name}
              </h2>

              <p className="nearby-chart-copy">
                Station distribution across Telangana districts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOperator(null)}
              style={{
                border: '1px solid #dce5f1',
                borderRadius: '9px',
                padding: '8px 10px',
                color: '#475569',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

          </div>


          <div className="stations-kpi">

            <article>
              <span>Total Stations</span>
              <strong>
                {selectedOperator.station_count}
              </strong>
              <small>
                Stations operated in Telangana
              </small>
            </article>

            <article>
              <span>Districts Covered</span>
              <strong>
                {selectedOperator.district_count}
              </strong>
              <small>
                Districts with stations
              </small>
            </article>

          </div>


          <div className="stations-chart">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedOperator.districts || []}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="station_count"
                  name="Stations"
                  fill="#2563eb"
                  radius={[0, 7, 7, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </section>
      )}

    </div>
  );
}