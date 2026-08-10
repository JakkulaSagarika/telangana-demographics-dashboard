import { Link } from 'react-router-dom';
import '../district-map.css';

const format = (value) => new Intl.NumberFormat('en-IN').format(value || 0);

export default function EVDistrictPanel({ district, onClose }) {
  if (!district) return null;

  const contributionWidth = `${Math.min(100, Math.max(0, Number(district.contribution || 0)))}%`;

  return (
    <aside className="district-info-panel">
      <div className="district-info-panel__header">
        <div>
          <p className="eyebrow">District insight</p>
          <h3>{district.name}</h3>
        </div>
        <button type="button" className="district-info-panel__close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="district-info-panel__divider" />

      <div className="district-info-panel__summary-grid">
        <article>
          <span>Stations</span>
          <strong>{format(district.stationCount)}</strong>
        </article>
        <article>
          <span>Operators</span>
          <strong>{format(district.operatorCount)}</strong>
        </article>
        <article>
          <span>Share of Telangana</span>
          <strong>{district.percentage}%</strong>
        </article>
        <article>
          <span>Top operator</span>
          <strong>{district.topOperator || '—'}</strong>
        </article>
      </div>

      <div className="district-info-panel__progress">
        <div className="district-info-panel__progress-head">
          <span>District contribution</span>
          <strong>{district.contribution}%</strong>
        </div>
        <div className="district-info-panel__meter">
          <div style={{ width: contributionWidth }} />
        </div>
      </div>

      <div className="district-info-panel__section">
        <h4>Top 5 Stations</h4>
        <ol className="district-info-panel__list">
          {district.topStations.map((station) => (
            <li key={station.id}>
              <Link to={`/ev/stations/${station.slug}`} onClick={onClose}>{station.name}</Link>
              <span>{station.owner_organization || '—'}</span>
            </li>
          ))}
        </ol>
      </div>

      <Link className="district-info-panel__action" to={`/ev/districts/${district.slug}`} onClick={onClose}>
        View District Analytics
      </Link>
    </aside>
  );
}
