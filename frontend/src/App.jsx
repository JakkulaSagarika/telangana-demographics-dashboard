import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DistrictDetail from './pages/DistrictDetail'
import Rankings from './pages/Rankings'
import DistrictTable from './pages/DistrictTable'
import CompareDistricts from './pages/CompareDistricts'
import GramPanchayats from './pages/GramPanchayats'
import Municipalities from './pages/Municipalities'
import MunicipalCorporations from './pages/MunicipalCorporations'
import PortalLanding from './pages/PortalLanding'
import EducationOverview from './pages/EducationOverview'
import EducationDistrictAnalytics from './pages/EducationDistrictAnalytics'
import EducationCompareDistricts from './pages/EducationCompareDistricts'
import SchoolInfrastructure from './pages/SchoolInfrastructure'
import CollegeAnalytics from './pages/CollegeAnalytics'
import LiteracyAnalytics from './pages/LiteracyAnalytics'

const links = [['/demographics', '⌂', 'Dashboard'], ['/demographics/districts', '◫', 'Districts'], ['/demographics/rankings', '↗', 'Rankings'], ['/demographics/compare', '⇄', 'Compare Districts'], ['/demographics/district-table', '▤', 'District Table'], ['/demographics/gram-panchayats', '⌘', 'Gram Panchayats'], ['/demographics/municipalities', '⌂', 'Municipalities'], ['/demographics/municipal-corporations', '▥', 'Municipal Corporations'], ['/reports', '◷', 'Reports'], ['/about', 'ⓘ', 'About']]

function DemographicsLayout() {
  return <div className="portal-shell"><aside className="side-nav"><NavLink className="portal-brand" to="/"><span>TS</span><b>Telangana</b><small>Demographics analytics</small></NavLink><nav>{links.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/demographics'}><i>{icon}</i>{label}</NavLink>)}</nav><div className="side-source"><b>NIC records</b><span>Birth &amp; death data<br/>33 districts</span></div></aside><div className="app-shell"><header className="site-header"><div><p className="eyebrow">Telangana demographics dashboard</p><strong>Vital event explorer</strong></div><NavLink className="header-tag" to="/">← Portal home</NavLink></header><main><Routes><Route index element={<Home/>}/><Route path="districts" element={<DistrictTable/>}/><Route path="districts/:slug" element={<DistrictDetail/>}/><Route path="rankings" element={<Rankings/>}/><Route path="compare" element={<CompareDistricts/>}/><Route path="district-table" element={<DistrictTable/>}/><Route path="gram-panchayats" element={<GramPanchayats/>}/><Route path="municipalities" element={<Municipalities/>}/><Route path="municipal-corporations" element={<MunicipalCorporations/>}/><Route path="*" element={<div className="notice">That page was not found. Use the sidebar to continue.</div>}/></Routes></main></div></div>
}

const educationLinks = [['/education', '⌂', 'Dashboard'], ['/education#education-rankings', '↗', 'District Rankings'], ['/education/compare', '⇄', 'Compare Districts'], ['/education/infrastructure', '▤', 'School Infrastructure'], ['/education/colleges', '⌘', 'College Analytics'], ['/education/literacy', '◉', 'Literacy Analytics']]

function EducationLayout() {
  return <div className="portal-shell education-shell"><aside className="side-nav"><NavLink className="portal-brand" to="/"><span>TS</span><b>Telangana</b><small>Education statistics</small></NavLink><nav>{educationLinks.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/education'}><i>{icon}</i>{label}</NavLink>)}</nav><div className="side-source"><b>Government datasets</b><span>Literacy, schools &amp; colleges<br/>District-level coverage</span></div></aside><div className="app-shell"><header className="site-header"><div><p className="eyebrow">Government of Telangana</p><strong>Education statistics dashboard</strong></div><NavLink className="header-tag" to="/">← Portal home</NavLink></header><main><Routes><Route index element={<EducationOverview/>}/><Route path="districts/:slug" element={<EducationDistrictAnalytics/>}/><Route path="compare" element={<EducationCompareDistricts/>}/><Route path="infrastructure" element={<SchoolInfrastructure/>}/><Route path="colleges" element={<CollegeAnalytics/>}/><Route path="literacy" element={<LiteracyAnalytics/>}/><Route path="*" element={<EducationOverview/>}/></Routes></main></div></div>
}

export default function App() { return <Routes><Route path="/" element={<PortalLanding/>}/><Route path="/demographics/*" element={<DemographicsLayout/>}/><Route path="/education/*" element={<EducationLayout/>}/><Route path="*" element={<PortalLanding/>}/></Routes> }
