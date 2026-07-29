import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDistricts } from '../api'
const columns = [['name', 'District'], ['births', 'Births'], ['deaths', 'Deaths'], ['births_male', 'Male births'], ['births_female', 'Female births'], ['gram_panchayats', 'Gram panchayats'], ['municipalities', 'Municipalities'], ['municipal_corporations', 'Corporations']]
const format = new Intl.NumberFormat('en-IN')
export default function DistrictTable() {
  const [districts, setDistricts] = useState([]), [query, setQuery] = useState(''), [sort, setSort] = useState('name')
  useEffect(() => { getDistricts().then(setDistricts).catch(() => {}) }, [])
  const rows = useMemo(() => districts.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).sort((a,b) => typeof a[sort] === 'string' ? a[sort].localeCompare(b[sort]) : b[sort]-a[sort]), [districts, query, sort])
  const exportCsv = () => { const header = columns.map(([, label]) => label).join(','); const records = rows.map(d => columns.map(([key]) => `"${d[key]}"`).join(',')); const url = URL.createObjectURL(new Blob([[header, ...records].join('\n')], {type:'text/csv'})); const link = document.createElement('a'); link.href = url; link.download = 'telangana-vital-statistics.csv'; link.click(); URL.revokeObjectURL(url) }
  return <><section className="page-title"><p className="eyebrow">All districts · NIC workbook</p><h1>District data table</h1><p>Search, sort, export, or open a district’s vital-statistics profile.</p></section><div className="table-actions"><input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a district" /><button className="export-button" onClick={exportCsv}>↓ Export CSV</button></div>
  <div className="table-wrap"><table><thead><tr>{columns.map(([key, label]) => <th key={key}><button onClick={() => setSort(key)}>{label} ↕</button></th>)}</tr></thead><tbody>{rows.map(d => <tr key={d.slug}>{columns.map(([key]) => <td key={key}>{key === 'name' ? <Link to={`/demographics/districts/${d.slug}`}>{d.name}</Link> : format.format(d[key])}</td>)}</tr>)}</tbody></table>{!rows.length && <div className="empty-copy">No district data has been imported yet.</div>}</div></>
}
