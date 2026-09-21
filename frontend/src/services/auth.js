const csrf = () => document.cookie.split('; ').find((cookie) => cookie.startsWith('csrftoken='))?.split('=')[1]

async function request(path, options = {}) {
  await fetch('/api/auth/csrf/', { credentials: 'same-origin' })
  const response = await fetch(`/api/auth/${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() || '', ...options.headers }, ...options })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw data
  return data
}

export const signIn = (email, password) => request('login/', { method: 'POST', body: JSON.stringify({ email, password }) })
export const register = (email, password) => request('register/', { method: 'POST', body: JSON.stringify({ email, password }) })
export const signOut = () => request('logout/', { method: 'POST' })
export const startGoogleSignIn = async () => (await request('google/start/')).url
export const getCurrentUser = async () => {
  const response = await fetch('/api/auth/me/', { credentials: 'same-origin' })
  if (!response.ok) return null
  return (await response.json()).user
}
