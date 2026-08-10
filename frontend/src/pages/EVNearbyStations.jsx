import { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { getEvStations } from '../api';
import '../ev-dashboard.css';

const DEFAULT_CENTER = [17.385, 78.4867];
const RADIUS_OPTIONS = [5, 10, 20, 50];
const stationPin = L.divIcon({ className: 'nearby-station-pin', html: '<span>⚡</span>', iconSize: [30, 30], iconAnchor: [15, 15] });
const userPin = L.divIcon({ className: 'nearby-user-pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });

const distanceInKm = (lat1, lon1, lat2, lon2) => {
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1), dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function MapFocus({ location, stations }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    const points = [[location.latitude, location.longitude], ...stations.map((station) => [station.latitude, station.longitude])];
    if (points.length > 1) map.fitBounds(points, { padding: [38, 38], maxZoom: 13 });
    else map.setView(points[0], 12);
  }, [location, map, stations]);
  return null;
}

export default function EVNearbyStations() {
  const [stations, setStations] = useState([]);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(20);
  const [locationStatus, setLocationStatus] = useState('Requesting your location…');

  useEffect(() => { getEvStations().then(setStations).catch(() => setStations([])); }, []);
  const requestLocation = () => {
    if (!navigator.geolocation) return setLocationStatus('Location is not supported by this browser.');
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationStatus('Your current location is shown on the map.'); },
      () => setLocationStatus('We could not access your location. Enable location permission and try again.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };
  useEffect(() => { requestLocation(); }, []);

  const rankedStations = useMemo(() => !location ? [] : stations
    .filter((station) => Number.isFinite(Number(station.latitude)) && Number.isFinite(Number(station.longitude)) && Number(station.latitude) !== 0 && Number(station.longitude) !== 0)
    .map((station) => ({ ...station, latitude: Number(station.latitude), longitude: Number(station.longitude), distance: distanceInKm(location.latitude, location.longitude, Number(station.latitude), Number(station.longitude)) }))
    .sort((a, b) => a.distance - b.distance), [location, stations]);
  const stationsInRadius = useMemo(() => rankedStations.filter((station) => station.distance <= radius), [rankedStations, radius]);
  const nearbyStations = stationsInRadius.slice(0, 10);
  const displayStations = nearbyStations.length ? nearbyStations : rankedStations.slice(0, 10);
  const isShowingFallback = !nearbyStations.length && rankedStations.length > 0;
  const chartData = displayStations.slice(0, 6).map((station, index) => ({ name: `${index + 1}`, distance: Number(station.distance.toFixed(1)), station: station.name }));

  return <div className="nearby-page">
    <section className="nearby-hero"><div><p className="eyebrow">EV infrastructure · location search</p><h1>Nearby EV stations</h1><p>Find charging stations closest to you, compare their distance, and open directions when you are ready to go.</p></div><button type="button" className="nearby-location-button" onClick={requestLocation}>⌖ Use my location</button></section>
    <section className="nearby-controls" aria-label="Nearby station filters"><div><span className="nearby-control-label">Search radius</span><div className="nearby-radius-options">{RADIUS_OPTIONS.map((option) => <button key={option} type="button" className={radius === option ? 'active' : ''} onClick={() => setRadius(option)}>{option} km</button>)}</div></div><p className={location ? 'nearby-location-status is-ready' : 'nearby-location-status'}><i>●</i>{locationStatus}</p></section>
    {!location ? <div className="ev-empty nearby-location-empty">Your nearest stations will appear here as soon as location access is available.</div> : <>
      <section className="nearby-summary"><article><span>Stations within {radius} km</span><strong>{stationsInRadius.length}</strong><small>{isShowingFallback ? 'Showing closest stations outside this radius' : 'Sorted from closest to farthest'}</small></article><article><span>Closest station</span><strong>{rankedStations[0] ? `${rankedStations[0].distance.toFixed(1)} km` : '—'}</strong><small>{rankedStations[0]?.name || 'No valid station coordinates found'}</small></article><article><span>Location accuracy</span><strong>Live</strong><small>Based on your browser’s GPS estimate</small></article></section>
      <section className="nearby-map-card"><div className="nearby-section-heading"><div><p className="eyebrow">Live map</p><h2>Your location and nearby chargers</h2></div><span className="nearby-map-key"><i></i>You <b>⚡</b> Station</span></div><MapContainer className="nearby-map" center={DEFAULT_CENTER} zoom={10} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapFocus location={location} stations={displayStations} /><Marker position={[location.latitude, location.longitude]} icon={userPin}><Popup>Your current location</Popup></Marker><Circle center={[location.latitude, location.longitude]} radius={radius * 1000} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.08, weight: 1.5 }} />{displayStations.map((station) => <Marker key={station.id} position={[station.latitude, station.longitude]} icon={stationPin}><Popup><strong>{station.name}</strong><br />{station.distance.toFixed(1)} km away</Popup></Marker>)}{displayStations.slice(0, 3).map((station) => <Polyline key={`line-${station.id}`} positions={[[location.latitude, location.longitude], [station.latitude, station.longitude]]} pathOptions={{ color: '#7c3aed', weight: 1.5, dashArray: '5 7', opacity: 0.65 }} />)}</MapContainer></section>
      <section className="nearby-content-grid"><div><div className="nearby-section-heading"><div><p className="eyebrow">Closest results</p><h2>{isShowingFallback ? 'Closest stations available' : `Nearest stations within ${radius} km`}</h2></div><span>{displayStations.length} shown</span></div><div className="nearby-station-list">{displayStations.map((station, index) => <article className="nearby-station-card" key={station.id}><div className="nearby-distance"><b>#{index + 1}</b><strong>{station.distance.toFixed(1)}<small>km</small></strong></div><div className="nearby-station-info"><h3>{station.name}</h3><p>{station.district || 'District unavailable'} <span>•</span> {station.owner_organization || 'Operator unavailable'}</p><address>{station.address || 'Address unavailable'}</address></div><div className="nearby-card-actions"><Link to={`/ev/stations/${station.slug}`}>View details</Link><a href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`} target="_blank" rel="noreferrer">Navigate ↗</a></div></article>)}</div></div><aside className="nearby-chart-card"><p className="eyebrow">Distance comparison</p><h2>How far is each charger?</h2><p className="nearby-chart-copy">Each bar shows straight-line distance from your current location.</p><div className="nearby-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 12 }}><CartesianGrid stroke="#edf1f7" horizontal={false} /><XAxis type="number" unit=" km" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value} km`, 'Distance']} labelFormatter={(label) => chartData.find((item) => item.name === label)?.station || `Station ${label}`} /><Bar dataKey="distance" fill="#2563eb" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer></div><div className="nearby-chart-legend">1–{chartData.length} correspond to the station cards at left.</div></aside></section>
    </>}
  </div>;
}
