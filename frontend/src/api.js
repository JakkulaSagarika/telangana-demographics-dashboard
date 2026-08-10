const api = async (path) => {
  const response = await fetch(`/api/${path}`)
  if (!response.ok) throw new Error('Could not load dashboard data.')
  return response.json()
}
export const getDistricts = () => api('districts/')
export const getDistrict = (slug) => api(`districts/${slug}/`)
export const getOverview = () => api('overview/')
export const getLocalBodies = (type) => api(`local-bodies/${type ? `?type=${type}` : ''}`)
export const getEducationOverview = () => api('education/overview/')
export const getEducationDropout = () => api('education/dropout/')
export const getEducationDistrict = (slug) => api(`education/districts/${slug}/`)
export const getEvOverview = () => api('ev/overview/')
export const getEvStations = (district = '', owner = '') => api(`ev/stations/${district || owner ? `?${[district ? `district=${encodeURIComponent(district)}` : '', owner ? `owner=${encodeURIComponent(owner)}` : ''].filter(Boolean).join('&')}` : ''}`)
