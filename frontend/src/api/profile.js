const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function getToken() {
  const token = localStorage.getItem('user_token')
  if (!token) {
    throw new Error('Please log in to continue')
  }
  return token
}

async function request(path, { method = 'GET', body, formData = false } = {}) {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  }

  if (!formData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (formData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const userId = localStorage.getItem('user_id')
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_profile_photo')
      if (userId) localStorage.removeItem(`user_profile_photo_${userId}`)
    }
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export function getProfile() {
  return request('/api/profile')
}

export function updateProfile(payload) {
  return request('/api/profile', { method: 'PUT', body: payload })
}

export function createOrUpdateProfile(payload) {
  return request('/api/profile', { method: 'POST', body: payload })
}

export function submitKyc(payload) {
  return request('/api/profile/kyc', { method: 'POST', body: payload })
}

export function uploadProfileDocument(formData) {
  return request('/api/profile/document', { method: 'POST', body: formData, formData: true })
}

export function lookupIfsc(ifscCode) {
  return request(`/api/profile/ifsc/${encodeURIComponent(ifscCode)}`)
}

export function getProfileSessions() {
  return request('/api/profile/sessions')
}

export function revokeProfileSession(sessionId) {
  return request(`/api/profile/sessions/${sessionId}`, { method: 'DELETE' })
}

export function updateProfileNotifications(payload) {
  return request('/api/profile/notifications', { method: 'PUT', body: payload })
}

export function changePassword(payload) {
  return request('/api/profile/change-password', { method: 'PUT', body: payload })
}

export async function openDocumentInNewTab(docType) {
  const token = localStorage.getItem('user_token')
  if (!token) throw new Error('Please log in to continue')
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const response = await fetch(`${base}/api/profile/document/${docType}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Could not load document')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
