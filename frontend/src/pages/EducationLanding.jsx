import { Link } from 'react-router-dom'
import '../portal-landing.css'

export default function EducationLanding() { return <div className="education-landing"><Link to="/" className="back-home">← Telangana State Analytics Portal</Link><section><p className="eyebrow">Education statistics dashboard</p><h1>Education insights<br/>for Telangana.</h1><p>This independent module is ready for the official education dataset. It will cover schools, literacy, enrollment, and district-level comparisons.</p><Link to="/demographics" className="primary-action">Explore demographics <span>→</span></Link></section></div> }
