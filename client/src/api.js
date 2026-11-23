async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include', // send the HttpOnly token cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = new Error('Request failed')
    err.status = res.status
    try { err.body = await res.json() } catch { /* no body */ }
    throw err
  }
  return res.json()
}

export const getMe = () => request('/api/me')
export const logout = () => request('/api/auth/logout', { method: 'POST' })
export const listCapsules = () => request('/api/capsules')
export const createCapsule = (data) =>
  request('/api/capsules', { method: 'POST', body: JSON.stringify(data) })
export const updateCapsule = (id, data) =>
  request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCapsule = (id) =>
  request(`/api/capsules/${id}`, { method: 'DELETE' })