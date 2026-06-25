import { useEffect, useState } from 'react'
import { IconBell, IconBuildingBank } from '@tabler/icons-react'
import ProfileDropdown from './ProfileDropdown'
import './app-navbar.css'

const NAV_LINKS = [
	{ key: 'information', label: 'Information', href: '#/information' },
	{ key: 'apply-loan', label: 'Apply Loan', href: '#/apply-loan' },
	{ key: 'dashboard', label: 'Dashboard', href: '#/dashboard' },
	{ key: 'profile', label: 'Profile', href: '#/profile' },
	{ key: 'analytics', label: 'Analytics' },
	{ key: 'support', label: 'Support' },
]

function readCachedProfile() {
	try {
		const cached = localStorage.getItem('user_profile')
		return cached ? JSON.parse(cached) : null
	} catch {
		return null
	}
}

function getInitials(profile) {
	const first = profile?.first_name?.[0] || 'S'
	const last = profile?.last_name?.[0] || 'A'
	return `${first}${last}`.toUpperCase()
}

export default function AppNavbar({ activePage = 'information' }) {
	const [profileOpen, setProfileOpen] = useState(false)
	const [profile, setProfile] = useState(() => readCachedProfile())
	const initials = getInitials(profile)

	useEffect(() => {
		const refresh = () => setProfile(readCachedProfile())
		window.addEventListener('storage', refresh)
		window.addEventListener('profile-photo-updated', refresh)
		return () => {
			window.removeEventListener('storage', refresh)
			window.removeEventListener('profile-photo-updated', refresh)
		}
	}, [])

	const navigate = (href) => {
		if (href) window.location.hash = href
	}

	return (
		<header className="app-navbar">
			<button type="button" className="app-brand" onClick={() => navigate('#/information')}>
				<span><IconBuildingBank size={22} /></span>
				<span>
					<strong>EZL Loan</strong>
					<small>Empowering Financial Journeys</small>
				</span>
			</button>

			<nav aria-label="Primary navigation">
				{NAV_LINKS.map((link) => (
					<button
						key={link.key}
						type="button"
						className={activePage === link.key ? 'active' : ''}
						onClick={() => navigate(link.href)}
					>
						{link.label}
					</button>
				))}
			</nav>

			<div className="app-nav-actions">
				<button type="button" className="app-nav-icon" aria-label="Notifications">
					<IconBell size={18} />
				</button>
				<div className="app-nav-profile">
					<button type="button" className="app-nav-avatar" onClick={() => setProfileOpen((open) => !open)}>
						{profile?.photo
							? <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
							: initials}
					</button>
					<ProfileDropdown open={profileOpen} onClose={() => setProfileOpen(false)} />
				</div>
			</div>
		</header>
	)
}
