import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import { getEvStations } from '../api';
import '../ev-dashboard.css';

const stationPin = L.divIcon({ className: 'detail-map-pin detail-map-pin--station', html: '<span>⚡</span>', iconSize: [32, 32], iconAnchor: [16, 32] });
const nearbyPin = L.divIcon({ className: 'detail-map-pin detail-map-pin--nearby', html: '<span>●</span>', iconSize: [22, 22], iconAnchor: [11, 11] });
const userPin = L.divIcon({ className: 'detail-map-pin detail-map-pin--user', html: '<span>⌖</span>', iconSize: [26, 26], iconAnchor: [13, 13] });

const distanceInKm = (first, second) => {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(second.latitude - first.latitude), dLng = radians(second.longitude - first.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function DetailViewport({ station, nearby }) {
  const map = useMap();
  useEffect(() => {
    if (!station) return;
    const points = [[station.latitude, station.longitude], ...nearby.map((item) => [item.latitude, item.longitude])];
    if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
    else map.setView(points[0], 13);
  }, [map, station, nearby]);
  return null;
}

export default function EVStationDetail() {
  const { slug } = useParams();
  const [stations, setStations] = useState([]);
  const [location, setLocation] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { getEvStations().then((data) => { setStations(data); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 });
  }, []);

  const station = stations.find((item) => item.slug === slug);
  const stationPoint = station && { ...station, latitude: Number(station.latitude), longitude: Number(station.longitude) };
  const nearby = useMemo(() => !stationPoint ? [] : stations.filter((item) => item.id !== stationPoint.id && Number(item.latitude) && Number(item.longitude)).map((item) => ({ ...item, latitude: Number(item.latitude), longitude: Number(item.longitude), distance: distanceInKm(stationPoint, { latitude: Number(item.latitude), longitude: Number(item.longitude) }) })).sort((a, b) => a.distance - b.distance).slice(0, 5), [stations, stationPoint?.id]);
  const userDistance = location && stationPoint ? distanceInKm(location, stationPoint) : null;
  const districtStationCount = useMemo(() => station ? stations.filter((item) => item.district === station.district).length : 0, [stations, station]);
  const operatorStationCount = useMemo(() => station ? stations.filter((item) => item.owner_organization === station.owner_organization).length : 0, [stations, station]);
  const distanceChart = nearby.map((item, index) => ({ label: `${index + 1}`, distance: Number(item.distance.toFixed(1)), name: item.name }));

  if (!loaded) return <div className="ev-empty">Loading station information…</div>;
  if (!stationPoint) return <div className="ev-empty">This charging station could not be found. <Link to="/ev/stations">Back to stations</Link></div>;

  return <div className="station-detail-page">
    <Link to="/ev/stations" className="station-back">← Back to charging stations</Link>
    <section className="station-detail-hero"><div><p className="eyebrow">EV infrastructure · station profile</p><h1>{station.name}</h1><p>{station.address || 'Address details were not supplied in the source dataset.'}</p><div className="station-detail-tags"><span>{station.district || 'District unavailable'}</span><span>{station.owner_organization || 'Operator unavailable'}</span></div></div><a className="station-navigate-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${stationPoint.latitude},${stationPoint.longitude}`} target="_blank" rel="noreferrer">Navigate ↗</a></section>
    <section className="station-detail-kpis"><article><span>Your distance</span><strong>{userDistance === null ? '—' : `${userDistance.toFixed(1)} km`}</strong><small>{userDistance === null ? 'Enable location access to calculate' : 'Straight-line distance from your location'}</small></article><article><span>Nearby chargers</span><strong>{nearby.length}</strong><small>Closest stations in the supplied dataset</small></article><article><span>District context</span><strong>{districtStationCount}</strong><small>Stations recorded in {station.district || 'this district'}</small></article><article><span>Operator footprint</span><strong>{operatorStationCount}</strong><small>Stations operated by this organization</small></article></section>
    <section className="station-detail-main"><article className="station-info-card"><p className="eyebrow">Station information</p><h2>Charging-point details</h2><dl><div><dt>Operator</dt><dd>{station.owner_organization || 'Not listed'}</dd></div><div><dt>District</dt><dd>{station.district || 'Not listed'}</dd></div><div><dt>Address</dt><dd>{station.address || 'Not listed'}</dd></div><div><dt>Coordinates</dt><dd>{stationPoint.latitude.toFixed(6)}, {stationPoint.longitude.toFixed(6)}</dd></div></dl></article><article className="station-map-card"><div className="station-section-heading"><div><p className="eyebrow">Location</p><h2>Station mini map</h2></div><span><i /> Station <b>●</b> Nearby</span></div><MapContainer className="station-detail-map" center={[stationPoint.latitude, stationPoint.longitude]} zoom={13} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><DetailViewport station={stationPoint} nearby={nearby} /><Marker position={[stationPoint.latitude, stationPoint.longitude]} icon={stationPin}><Popup><strong>{station.name}</strong><br />Selected station</Popup></Marker>{nearby.map((item) => <Marker key={item.id} position={[item.latitude, item.longitude]} icon={nearbyPin}><Popup><strong>{item.name}</strong><br />{item.distance.toFixed(1)} km away</Popup></Marker>)}{location && <Marker position={[location.latitude, location.longitude]} icon={userPin}><Popup>Your location</Popup></Marker>}</MapContainer></article></section>
    <section className="station-detail-lower"><article className="station-nearby-card"><div className="station-section-heading"><div><p className="eyebrow">Nearby charging</p><h2>Closest stations</h2></div><span>{nearby.length} shown</span></div>{nearby.length ? <div className="station-nearby-list">{nearby.map((item, index) => <Link key={item.id} to={`/ev/stations/${item.slug}`}><b>{index + 1}</b><div><strong>{item.name}</strong><span>{item.district || 'District unavailable'} · {item.owner_organization || 'Operator unavailable'}</span></div><em>{item.distance.toFixed(1)} km</em></Link>)}</div> : <div className="ev-empty">No nearby stations with valid coordinates were found.</div>}</article><article className="station-distance-card"><p className="eyebrow">Distance comparison</p><h2>Nearby station distances</h2><div className="station-distance-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={distanceChart} layout="vertical" margin={{ left: -20, right: 12 }}><CartesianGrid stroke="#edf1f7" horizontal={false} /><XAxis type="number" unit=" km" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value} km`, 'Distance']} labelFormatter={(label) => distanceChart.find((item) => item.label === label)?.name || 'Nearby station'} /><Bar dataKey="distance" fill="#7c3aed" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer></div><p>1–{nearby.length} correspond to the nearby-station list.</p></article></section>
  </div>;
}
