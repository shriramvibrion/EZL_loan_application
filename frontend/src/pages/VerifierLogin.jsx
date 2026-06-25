import { useState } from 'react'
import './verifier.css'
import heroBg from '../../image/img.jpg'
import { loginVerifier } from '../api/auth'

export default function VerifierLogin() {
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		const form = e.target
		setError('')
		setLoading(true)

		try {
			const data = await loginVerifier({
				email: form.email.value,
				password: form.password.value,
			})

			localStorage.setItem('verifier_token', data.token)
			localStorage.setItem('verifier_id', String(data.verifier_id))
			window.location.hash = '#/verifier-dashboard'
		} catch (err) {
			setError(err.message || 'Unable to log in')
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="verifier-page">
			<img className="verifier-bg" src={heroBg} alt="Office background" />
			<div className="verifier-overlay" aria-hidden="true" />

			<div className="verifier-container">
				<div className="verifier-card">
					<header className="verifier-header">
						<div className="verifier-badge">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<h1>Verifier Login</h1>
						<p>KYC &amp; document verification portal</p>
					</header>

					<form className="verifier-form" onSubmit={handleSubmit}>
						<input name="email" type="email" required placeholder="Work Email" />

						<label className="password-wrap" aria-label="Password field">
							<input
								name="password"
								type={showPassword ? 'text' : 'password'}
								required
								placeholder="Password"
							/>
							<button
								type="button"
								className="password-toggle"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
								onClick={() => setShowPassword((prev) => !prev)}
							>
								{showPassword ? (
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M2 4.27L3.28 3 21 20.72 19.73 22l-3.03-3.03A11.14 11.14 0 0 1 12 20C7 20 2.73 16.89 1 12a13.24 13.24 0 0 1 4.25-5.92L2 4.27zM7.11 7.84A8.78 8.78 0 0 0 3.2 12 9.9 9.9 0 0 0 12 18c1.16 0 2.28-.2 3.31-.58l-2.16-2.16A3.99 3.99 0 0 1 8.74 10.85L7.1 9.21v-1.37zm4.86 4.86l-2.82-2.82a2 2 0 0 0 2.82 2.82zm9.03-.7c-.62 1.75-1.74 3.32-3.18 4.56l-1.45-1.45A8.8 8.8 0 0 0 20.8 12 9.9 9.9 0 0 0 12 6c-1.3 0-2.55.24-3.7.67L6.74 5.11A11.5 11.5 0 0 1 12 4c5 0 9.27 3.11 11 8z" />
									</svg>
								) : (
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M12 5c5 0 9.27 3.11 11 7-1.73 3.89-6 7-11 7S2.73 15.89 1 12c1.73-3.89 6-7 11-7zm0 2C8.12 7 4.78 9.33 3.1 12 4.78 14.67 8.12 17 12 17s7.22-2.33 8.9-5C19.22 9.33 15.88 7 12 7zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" />
									</svg>
								)}
							</button>
						</label>

						<button className="btn primary" type="submit" disabled={loading}>
							{loading ? 'LOGGING IN...' : 'LOGIN'}
						</button>
						{error ? <p className="form-message error">{error}</p> : null}
					</form>

					<button className="btn neutral" type="button" onClick={() => (window.location.hash = '#/')}>
						Back to Home
					</button>
				</div>
			</div>
		</main>
	)
}
