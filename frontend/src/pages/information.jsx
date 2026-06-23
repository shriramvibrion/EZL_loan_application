import { useMemo } from 'react'
import {
  IconBuildingBank,
  IconCalendarCheck,
  IconChartBar,
  IconCircleCheck,
  IconClock,
  IconCreditCard,
  IconFileText,
  IconHeadset,
  IconHome,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconTrendingUp,
  IconUser,
  IconWallet,
} from '@tabler/icons-react'
import AppNavbar from '../components/AppNavbar'
import './Information.css'

function navigate(route) {
  window.location.hash = route
}

function readCachedProfile() {
  try {
    const cached = localStorage.getItem('user_profile')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

const LOAN_TYPES = [
  {
    title: 'Personal Loan',
    text: 'Flexible funds for medical needs, education, travel, and planned expenses.',
    icon: IconUser,
  },
  {
    title: 'Home Loan',
    text: 'Long tenure options for buying, building, or renovating your home.',
    icon: IconHome,
  },
  {
    title: 'Business Loan',
    text: 'Working capital and growth financing for established businesses.',
    icon: IconBuildingBank,
  },
  {
    title: 'Vehicle Loan',
    text: 'Simple financing for two-wheelers, cars, and commercial vehicles.',
    icon: IconWallet,
  },
]

const HIGHLIGHTS = [
  { label: 'Approval Window', value: '24-48 hrs', icon: IconClock },
  { label: 'Secure Processing', value: '256-bit', icon: IconLock },
  { label: 'Partner Banks', value: '15+', icon: IconBuildingBank },
  { label: 'Digital Tracking', value: 'Live', icon: IconChartBar },
]

const STEPS = [
  'Choose your loan type and amount',
  'Confirm applicant and KYC details',
  'Upload required documents',
  'Review, submit, and track status',
]

export default function Information() {
  const profile = useMemo(() => readCachedProfile(), [])
  const displayName = titleCase(profile?.first_name) || 'there'

  return (
    <main className="info-page">
      <AppNavbar activePage="information" />

      <section className="info-hero">
        <div className="info-hero-copy">
          <span className="info-eyebrow"><IconInfoCircle size={17} /> Loan information center</span>
          <h1>Welcome, {displayName}. Review your loan options before applying.</h1>
          <p>
            Compare products, understand the document flow, and start a guided loan application only when you are ready.
          </p>
          <div className="info-hero-actions">
            <button type="button" className="info-primary-btn" onClick={() => navigate('#/apply-loan')}>
              Apply Loan
            </button>
            <button type="button" className="info-secondary-btn" onClick={() => navigate('#/dashboard')}>
              View Dashboard
            </button>
          </div>
        </div>

        <aside className="info-status-panel">
          <div className="info-status-head">
            <IconShieldCheck size={24} />
            <span>
              <strong>Profile readiness</strong>
              <small>Basic checks completed</small>
            </span>
          </div>
          <div className="info-readiness">
            <span style={{ width: `${profile?.completion_percent || 72}%` }} />
          </div>
          <dl>
            <div><dt>KYC Status</dt><dd>Ready</dd></div>
            <div><dt>Next Step</dt><dd>Choose loan</dd></div>
            <div><dt>Support</dt><dd>Online</dd></div>
          </dl>
        </aside>
      </section>

      <section className="info-summary-grid" aria-label="Loan service highlights">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon
          return (
            <article className="info-summary-card" key={item.label}>
              <span><Icon size={20} /></span>
              <strong>{item.value}</strong>
              <small>{item.label}</small>
            </article>
          )
        })}
      </section>

      <section className="info-content-grid">
        <div className="info-section">
          <div className="info-section-title">
            <span><IconCreditCard size={20} /></span>
            <div>
              <h2>Available Loan Products</h2>
              <p>Pick the product that matches your requirement before starting the application.</p>
            </div>
          </div>

          <div className="info-loan-grid">
            {LOAN_TYPES.map((loan) => {
              const Icon = loan.icon
              return (
                <article className="info-loan-card" key={loan.title}>
                  <span><Icon size={22} /></span>
                  <div>
                    <h3>{loan.title}</h3>
                    <p>{loan.text}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="info-section info-process-card">
          <div className="info-section-title compact">
            <span><IconFileText size={20} /></span>
            <div>
              <h2>Application Flow</h2>
              <p>What happens after you click Apply Loan.</p>
            </div>
          </div>

          <ol className="info-step-list">
            {STEPS.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="info-assist-band">
        <div>
          <IconHeadset size={28} />
          <span>
            <strong>Need help choosing?</strong>
            <small>Our support team can guide you through eligibility, documents, and repayment planning.</small>
          </span>
        </div>
        <div className="info-assist-actions">
          <button type="button"><IconCircleCheck size={18} /> Check Eligibility</button>
          <button type="button"><IconCalendarCheck size={18} /> Schedule Call</button>
          <button type="button"><IconTrendingUp size={18} /> Compare Rates</button>
        </div>
      </section>
    </main>
  )
}
