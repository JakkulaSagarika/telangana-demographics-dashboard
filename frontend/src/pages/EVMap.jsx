import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import EVDistrictPanel from '../components/EVDistrictPanel';
import { getEvStations } from '../api';
import '../district-map.css';

const districtBounds = [
  [17.3, 77.3],
  [19.7, 81.0],
];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const districtName = (feature) => feature.properties?.DISTRICT_N || feature.properties?.D_N || feature.properties?.district || feature.properties?.NAME_2 || '';

function FitMap({ geoJson, selectedDistrict }) {
  const map = useMap();
  useEffect(() => {
    if (!geoJson?.features?.length) return;
    if (selectedDistrict) {
      const layer = L.geoJSON(selectedDistrict);
      map.fitBounds(layer.getBounds(), { padding: [24, 24] });
      return;
    }
    const layer = L.geoJSON(geoJson);
    map.fitBounds(layer.getBounds(), { padding: [24, 24] });
  }, [geoJson, map, selectedDistrict]);

  return null;
}

export default function EVMap() {
  const [stations, setStations] = useState([]);
  const [geoJson, setGeoJson] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrictName, setHoveredDistrictName] = useState('');

  useEffect(() => {
    getEvStations().then(setStations).catch(() => setStations([]));
    fetch('/data/telangana-districts.geojson')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setGeoJson)
      .catch(() => setGeoJson(null));
  }, []);

  const districtMetrics = useMemo(() => {
    const counts = new Map();
    const operators = new Map();
    stations.forEach((station) => {
      const district = station.district || 'Unknown';
      counts.set(district, (counts.get(district) || 0) + 1);
      const owner = station.owner_organization || 'Unknown';
      operators.set(district, operators.get(district) || new Map());
      const districtOwners = operators.get(district);
      districtOwners.set(owner, (districtOwners.get(owner) || 0) + 1);
    });

    return [...counts.entries()].map(([name, stationCount]) => {
      const ownerMap = operators.get(name) || new Map();
      const topOwner = [...ownerMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      return { name, stationCount, operatorCount: ownerMap.size, topOwner };
    });
  }, [stations]);

  const totalStations = stations.length || 1;
  const districtDataByName = useMemo(() => new Map(districtMetrics.map((item) => [normalize(item.name), item])), [districtMetrics]);
  const districtOptions = useMemo(() => {
    if (!geoJson?.features?.length) return [];
    return geoJson.features
      .map((feature) => districtName(feature))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [geoJson]);

  const filteredDistrictOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return districtOptions;
    return districtOptions.filter((name) => name.toLowerCase().includes(query));
  }, [districtOptions, searchText]);

  const selectedDistrictName = selectedDistrict ? districtName(selectedDistrict) : '';
  const highlightedDistrictName = hoveredDistrictName || selectedDistrictName;

  const districtInfo = useMemo(() => {
    if (!selectedDistrict) return null;
    const name = districtName(selectedDistrict);
    const stats = districtDataByName.get(normalize(name)) || { stationCount: 0, operatorCount: 0, topOwner: '—' };
    const topStations = stations.filter((station) => normalize(station.district) === normalize(name)).slice(0, 5);
    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      stationCount: stats.stationCount,
      operatorCount: stats.operatorCount,
      topOperator: stats.topOwner,
      percentage: totalStations ? ((stats.stationCount / totalStations) * 100).toFixed(1) : '0.0',
      contribution: totalStations ? ((stats.stationCount / totalStations) * 100).toFixed(1) : '0.0',
      topStations,
    };
  }, [selectedDistrict, districtDataByName, stations, totalStations]);

  const styleDistrict = (feature) => {
    const name = districtName(feature);
    const stats = districtDataByName.get(normalize(name)) || { stationCount: 0 };
    const maxValue = Math.max(...districtMetrics.map((entry) => entry.stationCount), 1);
    const minValue = Math.min(...districtMetrics.map((entry) => entry.stationCount), 0);
    const ratio = maxValue === minValue ? 0.4 : (stats.stationCount - minValue) / (maxValue - minValue);
    const fillColor = `hsl(263 58% ${78 - ratio * 28}%)`;
    const isActive = highlightedDistrictName === name;
    return {
      color: isActive ? '#4f46e5' : '#ffffff',
      weight: isActive ? 2.3 : 1.1,
      fillColor,
      fillOpacity: isActive ? 0.95 : 0.78,
    };
  };

  const selectDistrict = (name) => {
    const match = geoJson?.features?.find((feature) => districtName(feature) === name) || null;
    setSelectedDistrict(match);
    setSearchText(name);
    setIsDropdownOpen(false);
  };

  const resetSelection = () => {
    setSelectedDistrict(null);
    setSearchText('');
    setHoveredDistrictName('');
    setIsDropdownOpen(false);
  };

  return (
     <>
    <section className="nearby-hero">
      <div>
        <p className="eyebrow">EV INFRASTRUCTURE · INTERACTIVE MAP</p>
        <h1>Interactive EV map</h1>
        <p>
          Explore Telangana's EV charging network by district, view station
          coverage, and discover charging infrastructure across the state.
        </p>
      </div>
    </section>
    <div
  className="district-map-wrap"
  style={{ height: '78vh', minHeight: 520, marginTop: '65px' }}
>
      <div className="district-map-toolbar">
        <div className="district-search">
          <label className="district-combobox">
            <span>Search district</span>
            <div className="district-search__input-wrap">
              <input
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Select a district"
              />
              <button type="button" className="district-search__toggle" onClick={() => setIsDropdownOpen((current) => !current)}>
                ▾
              </button>
            </div>
          </label>
          {isDropdownOpen && filteredDistrictOptions.length > 0 && (
            <div className="district-search__dropdown">
              {filteredDistrictOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="district-search__option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDistrict(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="header-tag district-map-toolbar__reset" onClick={resetSelection}>
          Reset view
        </button>
      </div>

      <MapContainer className="district-map" center={[17.9, 79.2]} zoom={7} minZoom={6} maxZoom={14} scrollWheelZoom zoomControl={false} bounds={districtBounds}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <FitMap geoJson={geoJson} selectedDistrict={selectedDistrict} />
        {geoJson && (
          <GeoJSON
            data={geoJson}
            style={styleDistrict}
            eventHandlers={{
              mouseover: (event) => {
                const label = districtName(event.layer.feature);
                setHoveredDistrictName(label);
                event.target.setStyle({ weight: 2.5, color: '#4f46e5', fillOpacity: 0.96 });
                if (label) {
                  const stats = districtDataByName.get(normalize(label)) || { stationCount: 0 };
                  event.target.bindTooltip(`<strong>${label}</strong><br/>EV stations: ${stats.stationCount}`, { sticky: true, className: 'district-tooltip' }).openTooltip();
                }
              },
              mouseout: (event) => {
                setHoveredDistrictName(selectedDistrictName);
                event.target.setStyle(styleDistrict(event.layer.feature));
                event.target.closeTooltip();
              },
              click: (event) => {
                const label = districtName(event.layer.feature);
                selectDistrict(label);
              },
            }}
          />
        )}
      </MapContainer>

      <EVDistrictPanel district={districtInfo} onClose={resetSelection} />
    </div>
  </>
  );
}
