const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, payload) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	const data = await response.json().catch(() => ({}))

	if (!response.ok) {
		throw new Error(data.error || 'Request failed')
	}

	return data
}

export function registerUser(payload) {
	return request('/api/register', payload)
}

export function loginUser(payload) {
	return request('/api/login', payload)
}

export function loginAdmin(payload) {
	return request('/api/admin/login', payload)
}

export function loginVerifier(payload) {
	return request('/api/verifier/login', payload)
}

export function loginDisburser(payload) {
	return request('/api/disburser/login', payload)
}