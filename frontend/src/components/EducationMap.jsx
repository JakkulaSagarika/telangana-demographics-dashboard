import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import '../district-map.css'

const clean = value => String(value || '').toLowerCase().replace(/[^a-z]/g, '')
const aliases = {
  jangoan: 'jangaon',
  jayashankarbhupalpally: 'jayashankarbhupalpalli',
  kumurambheemasifabad: 'komarambeemasifabad',
  warangal: 'warangalrural',
}
const normalise = value => aliases[clean(value)] || clean(value)
const featureName = feature => feature.properties.DISTRICT_N || feature.properties.D_N || feature.properties.district || feature.properties.NAME_2
const format = value => new Intl.NumberFormat('en-IN').format(value || 0)

function FitMap({ geoJson }) { const map = useMap(); useEffect(() => { if (geoJson?.features?.length) map.fitBounds(L.geoJSON(geoJson).getBounds(), { padding: [12, 12] }) }, [geoJson, map]); return null }

export default function EducationMap({ districts, layer }) {
  const [geoJson, setGeoJson] = useState(null)
  const navigate = useNavigate()
  useEffect(() => { fetch('/data/telangana-districts.geojson').then(r => r.ok ? r.json() : Promise.reject()).then(setGeoJson).catch(() => setGeoJson(null)) }, [])
  const dataByName = useMemo(() => new Map(districts.map(item => [normalise(item.name), item])), [districts])
  const field = { literacy: 'literacy_rate', maleLiteracy: 'male_literacy_rate', femaleLiteracy: 'female_literacy_rate', schools: 'total_schools', enrollment: 'total_enrollment', colleges: 'total_colleges' }[layer] || 'literacy_rate'
  const values = districts.map(item => Number(item[field]) || 0).filter(Boolean)
  const min = Math.min(...values, 0), max = Math.max(...values, 1)
  const colour = value => { if (!value) return '#e9e3ed'; const pct = (value - min) / (max - min || 1); return `hsl(${277 - pct * 34} ${62 + pct * 18}% ${88 - pct * 42}%)` }
  const label = { literacy: 'Literacy', maleLiteracy: 'Male literacy', femaleLiteracy: 'Female literacy', schools: 'Schools', enrollment: 'Enrollment', colleges: 'Colleges' }[layer]
  const onEachFeature = (feature, mapLayer) => {
    const name = featureName(feature) || 'District'; const district = dataByName.get(normalise(name))
    mapLayer.bindTooltip(`<strong>${district?.name || name}</strong><br/>Literacy: ${district ? `${district.literacy_rate.toFixed(2)}%` : 'Not reported'}<br/>Enrollment: ${district ? format(district.total_enrollment) : 'Not reported'}<br/>State rank: ${district ? `#${district.state_rank}` : '—'}`, { sticky: true, className: 'district-tooltip' })
    mapLayer.on({ mouseover: event => event.target.setStyle({ weight: 3, color: '#42227f', fillOpacity: .98 }), mouseout: event => event.target.setStyle({ weight: 1.2, color: '#fff', fillOpacity: .88 }), click: () => district && navigate(`/education/districts/${district.slug}`) })
  }
  if (!geoJson) return <div className="map-ready"><div className="map-grid-lines"/><div className="map-ready-content"><span>TS</span><strong>Loading district boundaries</strong><p>The education map will appear here.</p></div></div>
  return <div className="district-map-wrap education-map-wrap"><MapContainer className="district-map" center={[17.85, 79.2]} zoom={7} scrollWheelZoom={false}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FitMap geoJson={geoJson}/><GeoJSON data={geoJson} onEachFeature={onEachFeature} style={feature => ({ color: '#fff', weight: 1.2, fillColor: colour(dataByName.get(normalise(featureName(feature)))?.[field]), fillOpacity: .88 })}/></MapContainer><div className="geo-legend"><span>Low {label?.toLowerCase()}</span><i/><span>High</span></div></div>
}
