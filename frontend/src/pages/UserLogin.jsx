import { useState } from 'react'
import './user.css'
import heroBg from '../../image/img.jpg'
import { loginUser } from '../api/auth'

export default function UserLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    setError('')
    setLoading(true)

    try {
      const data = await loginUser({
        email: form.email.value,
        password: form.password.value,
      })

      localStorage.setItem('user_token', data.token)
      localStorage.setItem('user_id', String(data.user_id))
      localStorage.removeItem('user_profile_photo')
      // Store profile returned by server or fallback to basic registration fields
      if (data.profile) {
        localStorage.setItem('user_profile', JSON.stringify(data.profile))
      } else {
        // If server did not return a profile, try to construct from returned data
        const profileFallback = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          email: form.email.value || '',
          completion_percent: data.completion_percent || 20,
        }
        localStorage.setItem('user_profile', JSON.stringify(profileFallback))
      }
      window.location.hash = '#/information'
    } catch (err) {
      setError(err.message || 'Unable to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="user-page">
      <img className="user-bg" src={heroBg} alt="background" />

      <div className="user-container">
        <div className="user-card">
          <header className="user-header">
            <h1>User Login</h1>
          </header>

          <form className="user-form" onSubmit={handleSubmit}>
            <input name="email" type="email" required placeholder="Email" />

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

            <button className="btn primary1" type="submit" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
            {error ? <p className="form-message error">{error}</p> : null}
          </form>

          <div className="user-footer">
            <span>Not registered ?</span>
            <button className="link" onClick={() => (window.location.hash = '#/user-register')}>
              Register
            </button>
          </div>

          <button className="btn neutral" type="button" onClick={() => (window.location.hash = '#/')}>
            Home
          </button>
        </div>
      </div>
    </main>
  )
}
