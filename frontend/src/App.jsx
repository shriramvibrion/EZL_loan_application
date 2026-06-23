import { useEffect, useState } from 'react'
import Home from './pages/home'
import UserLogin from './pages/UserLogin'
import UserRegister from './pages/UserRegister'
import AdminLogin from './pages/AdminLogin'
import Information from './pages/Information'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import LoanDashboard from './pages/LoanDashboard'
import ApplyLoan from './pages/ApplyLoan'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')
  const isAuthenticated = Boolean(localStorage.getItem('user_token'))

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.startsWith('#/user-register')) return <UserRegister />
  if (route.startsWith('#/user-login')) return <UserLogin />
  if (route.startsWith('#/admin-login')) return <AdminLogin />
  if (route.startsWith('#/apply-loan')) return <ApplyLoan />
  if (route.startsWith('#/information')) return <Information />
  if (route.startsWith('#/dashboard')) return <LoanDashboard />
  if (route.startsWith('#/admin-dashboard')) return <AdminDashboard />
  if (route.startsWith('#/profile')) return <Profile />

  if (isAuthenticated) return <Information />

  return <Home />
}
