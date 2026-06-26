const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function getToken() {
  const token = localStorage.getItem('user_token')
  if (!token) throw new Error('Please log in to continue')
  return token
}

async function request(path, { method = 'GET', body, formData = false } = {}) {
  const headers = { Authorization: `Bearer ${getToken()}` }
  if (!formData) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (formData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

/** Get existing draft (if any) */
export function getLoanDraft() {
  return request('/api/loan/draft')
}

/** Auto-save draft — call on every step change */
export function saveLoanDraft(payload) {
  return request('/api/loan/draft', { method: 'POST', body: payload })
}

/** Final submission */
export function submitLoanApplication() {
  return request('/api/loan/submit', { method: 'POST' })
}

/** List all applications for the user */
export function listApplications() {
  return request('/api/loan/applications')
}

/** Get single application detail */
export function getApplication(loanId) {
  return request(`/api/loan/${loanId}`)
}

/** Upload a document for a specific loan */
export function uploadLoanDocument(loanId, docType, file) {
  const fd = new FormData()
  fd.append('doc_type', docType)
  fd.append('file', file)
  return request(`/api/loan/${loanId}/document`, { method: 'POST', body: fd, formData: true })
}

/** Open a loan document in a new tab */
export async function openLoanDocumentInNewTab(loanId, docType) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/loan/${loanId}/document/${docType}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Could not load document')
  }
  const blob = await response.blob()
  window.open(URL.createObjectURL(blob), '_blank')
}
