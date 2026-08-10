import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getEvStations } from '../api';
import { getDrivingRoute, searchPlace } from '../services/routing';
import '../ev-dashboard.css';

const DEFAULT_CENTER = [17.385, 78.4867];
const pin = (className, content) => L.divIcon({ className, html: content, iconSize: [30, 30], iconAnchor: [15, 30] });
const startPin = pin('route-pin route-pin--start', '<span>●</span>');
const destinationPin = pin('route-pin route-pin--destination', '<span>◆</span>');
const stationPin = pin('route-pin route-pin--station', '<span>⚡</span>');

const haversine = (first, second) => {
  const rad = (value) => (value * Math.PI) / 180;
  const dLat = rad(second[0] - first[0]), dLng = rad(second[1] - first[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(first[0])) * Math.cos(rad(second[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function RouteViewport({ points }) {
  const map = useMap();
  useEffect(() => { if (points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 12 }); }, [map, points]);
  return null;
}

const formatDistance = (value) => value >= 100 ? `${Math.round(value)} km` : `${value.toFixed(1)} km`;
const formatTime = (value) => value >= 60 ? `${Math.floor(value / 60)}h ${Math.round(value % 60)}m` : `${Math.round(value)} min`;

export default function EVRoutePlanner() {
  const [startText, setStartText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState('Enter a destination to start planning.');
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => { getEvStations().then(setStations).catch(() => setStations([])); }, []);
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setStatus('Location access is not supported by this browser.');
    setStatus('Finding your current location…');
    navigator.geolocation.getCurrentPosition((position) => {
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude, label: 'Current location' };
      setCurrentLocation(point); setStart(point); setStartText('Current location'); setStatus('Current location selected. Add a destination and plan your route.');
    }, () => setStatus('We could not access your location. Enter a start location instead.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  const planRoute = async (event) => {
    event.preventDefault();
    if (!startText.trim() && !currentLocation) return setStatus('Enter a start location or use your current location.');
    if (!destinationText.trim()) return setStatus('Enter a destination to plan a route.');
    setIsPlanning(true); setStatus('Finding the best road route…');
    try {
      const startPoint = startText === 'Current location' && currentLocation ? currentLocation : await searchPlace(startText.trim());
      const destinationPoint = await searchPlace(destinationText.trim());
      const routeResult = await getDrivingRoute(startPoint, destinationPoint);
      setStart(startPoint); setDestination(destinationPoint); setRoute(routeResult); setStatus('Route ready. Recommended charging stops are highlighted on the map.');
    } catch (error) { setStatus(error.message || 'Unable to plan this route.'); setRoute(null); } finally { setIsPlanning(false); }
  };

  const routeStations = useMemo(() => {
    if (!route) return [];
    return stations.filter((station) => Number(station.latitude) && Number(station.longitude)).map((station) => {
      const point = [Number(station.latitude), Number(station.longitude)];
      const nearestDistance = Math.min(...route.coordinates.map((routePoint) => haversine(point, routePoint)));
      return { ...station, latitude: point[0], longitude: point[1], detour: nearestDistance * 2, routeDistance: nearestDistance };
    }).filter((station) => station.routeDistance <= 15).sort((a, b) => a.detour - b.detour).slice(0, 8);
  }, [route, stations]);
  const recommendedStops = useMemo(() => routeStations.slice(0, Math.min(routeStations.length, route?.distanceKm > 250 ? 3 : 2)), [routeStations, route]);
  const routePoints = route ? route.coordinates : [];

  return <div className="route-page">
    <section className="route-hero"><div><p className="eyebrow">EV infrastructure · route planning</p><h1>Plan your charging route</h1><p>Map a road journey, see its estimated travel time, and choose charging stations that stay close to your route.</p></div></section>
    <form className="route-controls" onSubmit={planRoute}><div className="route-location-input"><label htmlFor="route-start">Start location</label><div><input id="route-start" value={startText} onChange={(event) => { setStartText(event.target.value); setStart(null); }} placeholder="Current location or a place" /><button type="button" onClick={useCurrentLocation}>Use current</button></div></div><div className="route-location-input"><label htmlFor="route-destination">Destination</label><input id="route-destination" value={destinationText} onChange={(event) => setDestinationText(event.target.value)} placeholder="Search a destination" /></div><button className="route-plan-button" disabled={isPlanning} type="submit">{isPlanning ? 'Planning…' : 'Plan route →'}</button></form>
    <p className={route ? 'route-status is-ready' : 'route-status'}><i>●</i>{status}</p>
    {route && <section className="route-summary"><article><span>Route distance</span><strong>{formatDistance(route.distanceKm)}</strong><small>OSRM driving route</small></article><article><span>Estimated travel time</span><strong>{formatTime(route.durationMinutes)}</strong><small>Excludes charging and traffic delays</small></article><article><span>Recommended charging stops</span><strong>{recommendedStops.length}</strong><small>{recommendedStops.length ? `${formatDistance(recommendedStops[0].detour)} estimated detour for the closest` : 'No station found within 15 km of route'}</small></article></section>}
    <section className="route-map-card"><div className="route-section-heading"><div><p className="eyebrow">Route map</p><h2>{route ? 'Your drive and nearby chargers' : 'Your route will appear here'}</h2></div>{route && <span className="route-map-key"><i></i>Route <b>⚡</b> Charger</span>}</div><MapContainer className="route-map" center={DEFAULT_CENTER} zoom={8} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{route && <><RouteViewport points={routePoints} /><Polyline positions={routePoints} pathOptions={{ color: '#2563eb', weight: 5, opacity: .88 }} /><Marker position={[start.latitude, start.longitude]} icon={startPin}><Popup><strong>Start</strong><br />{start.label}</Popup></Marker><Marker position={[destination.latitude, destination.longitude]} icon={destinationPin}><Popup><strong>Destination</strong><br />{destination.label}</Popup></Marker>{routeStations.map((station) => <Marker key={station.id} position={[station.latitude, station.longitude]} icon={stationPin}><Popup><strong>{station.name}</strong><br />{formatDistance(station.detour)} estimated detour</Popup></Marker>)}</>}</MapContainer></section>
    {route && <section className="route-results"><div><div className="route-section-heading"><div><p className="eyebrow">Charging guidance</p><h2>Recommended stops</h2></div><span>{routeStations.length} stations near route</span></div>{recommendedStops.length ? <div className="route-stop-list">{recommendedStops.map((station, index) => <article key={station.id} className="route-stop-card"><div className="route-stop-order">{index + 1}</div><div><h3>{station.name}</h3><p>{station.district || 'District unavailable'} <span>•</span> {station.owner_organization || 'Operator unavailable'}</p><address>{station.address || 'Address unavailable'}</address></div><div className="route-stop-detour"><strong>{formatDistance(station.detour)}</strong><small>estimated detour</small></div><a href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`} target="_blank" rel="noreferrer">Navigate ↗</a></article>)}</div> : <div className="ev-empty">No charging station in the dataset is within 15 km of this route.</div>}</div><aside className="route-insight"><p className="eyebrow">Trip at a glance</p><h2>Charging-stop summary</h2><div className="route-insight-visual"><b>{recommendedStops.length}</b><span>recommended<br />stops</span></div><p>Stops are ranked by estimated out-and-back detour from the OSRM route. Confirm availability with the operator before you leave.</p></aside></section>}
  </div>;
}
