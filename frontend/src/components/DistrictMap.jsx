import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import '../district-map.css'

const clean = value => String(value || '').toLowerCase().replace(/[^a-z]/g, '')
const aliases = { jayashankarbhupalpally: 'jayashankarbhupalpalli', kumurambheemasifabad: 'komarambheemasifabad', medchalmalkajgiri: 'medchalmalkajigiri' }
const normalise = value => aliases[clean(value)] || clean(value)
const featureName = feature => feature.properties.DISTRICT_N || feature.properties.D_N || feature.properties.district || feature.properties.NAME_2
const format = value => new Intl.NumberFormat('en-IN').format(value || 0)
function FitMap({ geoJson }) { const map = useMap(); useEffect(() => { if (geoJson?.features?.length) { const layer = L.geoJSON(geoJson); map.fitBounds(layer.getBounds(), { padding:[12,12] }) } }, [geoJson, map]); return null }

export default function DistrictMap({ districts }) {
  const [geoJson, setGeoJson] = useState(null)
  const navigate = useNavigate()
  useEffect(() => { fetch('/data/telangana-districts.geojson').then(response => response.ok ? response.json() : Promise.reject()).then(setGeoJson).catch(() => setGeoJson(null)) }, [])
  const dataByName = useMemo(() => new Map(districts.map(item => [normalise(item.name), item])), [districts])
  const values = geoJson?.features.map(feature => dataByName.get(normalise(featureName(feature)))?.births || 0) || []
  const min = Math.min(...values), max = Math.max(...values)
  const color = value => { const amount = max === min ? .7 : (value-min)/(max-min); return `hsl(${263 - amount*17} ${61 + amount*14}% ${89 - amount*43}%)` }
  const onEachFeature = (feature, layer) => { const label = featureName(feature) || 'District'; const district = dataByName.get(normalise(label)); const ratio = district?.deaths ? (district.births/district.deaths).toFixed(2) : '—'; layer.bindTooltip(`<strong>${district?.name || label}</strong><br/>Births: ${format(district?.births)}<br/>Deaths: ${format(district?.deaths)}<br/>Birth : Death — ${ratio} : 1`, {sticky:true,className:'district-tooltip'}); layer.on({mouseover:event=>event.target.setStyle({weight:3,color:'#40227f',fillOpacity:.98}),mouseout:event=>event.target.setStyle({weight:1.2,color:'#fff',fillOpacity:.86}),click:()=>district&&navigate(`/districts/${district.slug}`)}) }
  if (!geoJson) return <div className="map-ready"><div className="map-grid-lines"/><div className="map-ready-content"><span>TS</span><strong>District map ready</strong><p>District boundaries are loading.</p></div></div>
  return <div className="district-map-wrap"><MapContainer className="district-map" center={[17.85,79.2]} zoom={7} scrollWheelZoom={false}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FitMap geoJson={geoJson}/><GeoJSON data={geoJson} onEachFeature={onEachFeature} style={feature=>{const district=dataByName.get(normalise(featureName(feature)));return{color:'#fff',weight:1.2,fillColor:color(district?.births||0),fillOpacity:.86}}}/></MapContainer><div className="geo-legend"><span>Low births</span><i/><span>High births</span></div></div>
}
