import { useEffect, useState } from 'react'
import Home from './pages/home'
import UserLogin from './pages/UserLogin'
import UserRegister from './pages/UserRegister'
import AdminLogin from './pages/AdminLogin'
import VerifierLogin from './pages/VerifierLogin'
import DisburserLogin from './pages/DisburserLogin'
import Information from './pages/information'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import LoanDashboard from './pages/LoanDashboard'
import ApplyLoan from './pages/ApplyLoan'

function RequireUser({ children }) {
  const token = localStorage.getItem('user_token')
  if (!token) {
    window.location.hash = '#/user-login'
    return null
  }
  return children
}

function RequireVerifier({ children }) {
  const token = localStorage.getItem('verifier_token')
  if (!token) {
    window.location.hash = '#/verifier-login'
    return null
  }
  return children
}

function RequireDisburser({ children }) {
  const token = localStorage.getItem('disburser_token')
  if (!token) {
    window.location.hash = '#/disburser-login'
    return null
  }
  return children
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) {
    window.location.hash = '#/admin-login'
    return null
  }
  return children
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.startsWith('#/user-register')) return <UserRegister />
  if (route.startsWith('#/user-login')) return <UserLogin />
  if (route.startsWith('#/admin-login')) return <AdminLogin />
  if (route.startsWith('#/verifier-login')) return <VerifierLogin />
  if (route.startsWith('#/disburser-login')) return <DisburserLogin />

  if (route.startsWith('#/dashboard'))
    return <RequireUser><LoanDashboard /></RequireUser>

  if (route.startsWith('#/profile'))
    return <RequireUser><Profile /></RequireUser>

  if (route.startsWith('#/apply-loan'))
    return <RequireUser><ApplyLoan /></RequireUser>

  if (route.startsWith('#/information'))
    return <RequireUser><Information /></RequireUser>

  if (route.startsWith('#/admin-dashboard'))
    return <RequireAdmin><AdminDashboard /></RequireAdmin>

  const isAuthenticated = Boolean(localStorage.getItem('user_token'))
  if (isAuthenticated) return <Information />
  return <Home />
}