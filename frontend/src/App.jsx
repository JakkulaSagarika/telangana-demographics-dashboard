import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DistrictDetail from './pages/DistrictDetail'
import Rankings from './pages/Rankings'
import DistrictTable from './pages/DistrictTable'
import CompareDistricts from './pages/CompareDistricts'
import GramPanchayats from './pages/GramPanchayats'
import Municipalities from './pages/Municipalities'
import MunicipalCorporations from './pages/MunicipalCorporations'

const links = [['/', '⌂', 'Dashboard'], ['/districts', '◫', 'Districts'], ['/rankings', '↗', 'Rankings'], ['/compare', '⇄', 'Compare Districts'], ['/district-table', '▤', 'District Table'], ['/gram-panchayats', '⌘', 'Gram Panchayats'], ['/municipalities', '⌂', 'Municipalities'], ['/municipal-corporations', '▥', 'Municipal Corporations'], ['/reports', '◷', 'Reports'], ['/about', 'ⓘ', 'About']]

export default function App() {
  return <div className="portal-shell">
    <aside className="side-nav"><NavLink className="portal-brand" to="/"><span>TS</span><b>Telangana</b><small>Vital statistics</small></NavLink><nav>{links.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/'}><i>{icon}</i>{label}</NavLink>)}</nav><div className="side-source"><b>NIC records</b><span>Birth & death data<br/>33 districts</span></div></aside>
    <div className="app-shell"><header className="site-header"><div><p className="eyebrow">Telangana demographic dashboard</p><strong>Vital event explorer</strong></div><div className="header-tag">● Live workbook data</div></header>
    <main><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/districts" element={<DistrictTable />} />
      <Route path="/district-table" element={<DistrictTable />} />
      <Route path="/districts/:slug" element={<DistrictDetail />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/compare" element={<CompareDistricts />} />
      <Route path="/gram-panchayats" element={<GramPanchayats />} />
      <Route path="/municipalities" element={<Municipalities />} />
      <Route path="/municipal-corporations" element={<MunicipalCorporations />} />
      <Route path="*" element={<div className="notice">That page was not found. Use the sidebar to continue.</div>} />
    </Routes></main></div>
  </div>
}
