import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconLogout, IconUser } from '@tabler/icons-react'
import './profile-dropdown.css'

function readCachedProfile() {
  try {
    const cached = localStorage.getItem('user_profile')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export default function ProfileDropdown({ open, onClose }) {
  const ref = useRef(null)
  const [profile, setProfile] = useState(() => readCachedProfile())

  useEffect(() => {
    const timer = window.setTimeout(() => setProfile(readCachedProfile()), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  function titleCase(str) {
    return String(str)
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join(' ')
  }

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) onClose()
    }
    if (!open) return undefined
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  if (!open) return null

  const logout = () => {
    const userId = localStorage.getItem('user_id')
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_profile')
    localStorage.removeItem('user_profile_photo')
    if (userId) localStorage.removeItem(`user_profile_photo_${userId}`)
    localStorage.removeItem('user_id')
    window.location.hash = '#/user-login'
  }

  return createPortal(
    <div className="profile-dropdown" ref={ref} role="dialog" aria-label="Profile menu">
        <div className="pd-row">
          <div className="pd-avatar">
            {profile?.photo ? (
              <img src={profile.photo} alt="Profile" />
            ) : profile ? (
              `${(profile.first_name || '').slice(0,1)}${(profile.last_name || '').slice(0,1)}`.toUpperCase()
            ) : (
              'U'
            )}
          </div>
          <div>
            <div className="pd-name">{profile ? titleCase(`${profile.first_name || ''} ${profile.last_name || ''}`.trim()) : 'Guest'}</div>
          </div>
        </div>

      <div className="pd-actions">
        <button
          type="button"
          className="pd-action"
          onClick={() => {
            onClose()
            window.location.hash = '#/profile'
          }}
        >
          <IconUser size={14} /> View profile
        </button>
        <button type="button" className="pd-action pd-logout" onClick={logout}> <IconLogout size={14} /> Logout</button>
      </div>
    </div>,
    document.body,
  )
}
