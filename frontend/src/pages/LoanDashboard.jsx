import { useEffect, useMemo, useState } from 'react'
import {
  IconBuildingBank,
  IconCalendarCheck,
  IconChevronDown,
  IconClock,
  IconDots,
  IconEdit,
  IconFileText,
  IconHome,
  IconMessageCircle,
  IconSearch,
  IconUpload,
  IconUser,
  IconWallet,
  IconCar,
  IconBriefcase,
} from '@tabler/icons-react'
import AppNavbar from '../components/AppNavbar'
import './loan-dashboard.css'
import heroBg from '../../image/img.jpg'
import { listApplications } from '../api/loan'

const LOAN_TYPE_ICON = {
  'Personal Loan': IconUser,
  'Home Loan': IconHome,
  'Business Loan': IconBriefcase,
  'Vehicle Loan': IconCar,
  'Gold Loan': IconWallet,
}

const STATUS_TONE = {
  draft: 'slate',
  submitted: 'blue',
  verification_in_progress: 'amber',
  verified: 'green',
  disbursement_pending: 'amber',
  disbursed: 'violet',
  rejected: 'red',
  disbursement_rejected: 'red',
  closed: 'slate',
}

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Submitted',
  verification_in_progress: 'Under Verification',
  verified: 'Verified',
  disbursement_pending: 'Disbursement Pending',
  disbursed: 'Disbursed',
  rejected: 'Rejected',
  disbursement_rejected: 'Disbursement Rejected',
  closed: 'Closed',
}

const FILTERS = ['Personal', 'Home', 'Vehicle', 'Business', 'Gold']
const STATUS_FILTERS = ['All', 'Draft', 'Submitted', 'Verified', 'Disbursed', 'Rejected']

function titleCase(value) {
  return String(value || '').trim().toLowerCase().split(' ').filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' ')
}

function getCachedProfile() {
  try {
    const cached = localStorage.getItem('user_profile')
    return cached ? JSON.parse(cached) : null
  } catch { return null }
}

function money(value) {
  if (!value) return '—'
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function timeAgo(isoString) {
  if (!isoString) return '—'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}hr ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function LoanDashboard() {
  const profile = useMemo(() => getCachedProfile(), [])
  const displayName = titleCase(profile?.first_name) || 'User'

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    listApplications()
      .then((res) => setApplications(res.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Counts
  const total = applications.length
  const active = applications.filter((a) => ['submitted', 'verification_in_progress', 'verified', 'disbursement_pending'].includes(a.status)).length
  const pending = applications.filter((a) => a.status === 'draft').length
  const closed = applications.filter((a) => ['disbursed', 'closed', 'rejected', 'disbursement_rejected'].includes(a.status)).length

  const SUMMARY = [
    { label: 'Total Loans', value: total, tone: 'violet', icon: IconFileText },
    { label: 'Active Loans', value: active, tone: 'blue', icon: IconHome },
    { label: 'Pending/Draft', value: pending, tone: 'amber', icon: IconClock },
    { label: 'Closed / Disbursed', value: closed, tone: 'green', icon: IconCalendarCheck },
  ]

  // Filter + sort
  const filtered = applications
    .filter((a) => {
      if (searchQuery && !a.application_id?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (typeFilter && !a.loan_type?.toLowerCase().startsWith(typeFilter.toLowerCase())) return false
      if (statusFilter !== 'All' && STATUS_LABEL[a.status]?.toLowerCase() !== statusFilter.toLowerCase()) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'amount') return (b.amount || 0) - (a.amount || 0)
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '')
      return new Date(b.created_at) - new Date(a.created_at) // latest
    })

  // Recent activity — last 5 status changes across apps
  const activity = [...applications]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
    .map((a) => ({
      text: `${a.application_id} — ${STATUS_LABEL[a.status] || a.status}`,
      time: timeAgo(a.updated_at),
      tone: STATUS_TONE[a.status] || 'slate',
    }))

  return (
    <main className="loan-dash">
      <img className="loan-dash-bg" src={heroBg} alt="" aria-hidden="true" />
      <AppNavbar activePage="dashboard" />

      <section className="loan-shell">
        <div className="loan-panel">
          <div className="loan-breadcrumb">
            <span>Home</span>
            <b>My Applications</b>
          </div>

          <button type="button" className="loan-apply-btn" onClick={() => (window.location.hash = '#/apply-loan')}>
            Apply New Loan
          </button>

          <div className="loan-main-card">
            <section className="loan-dashboard-main">
              <h1>Welcome back, {displayName}!</h1>

              <div className="loan-summary-grid">
                {SUMMARY.map((item) => {
                  const Icon = item.icon
                  return (
                    <article className="loan-summary-card" key={item.label}>
                      <span className={`loan-summary-icon ${item.tone}`}><Icon size={19} /></span>
                      <span>
                        <strong>{item.value}</strong>
                        <small>{item.label}</small>
                      </span>
                    </article>
                  )
                })}
              </div>

              <section className="loan-filter-bar" aria-label="Loan filters">
                <label className="loan-search">
                  <span>Search by Loan ID</span>
                  <div>
                    <IconSearch size={15} />
                    <input type="search" placeholder="Search by Loan ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </label>

                <div className="loan-filter-group">
                  <span>Filter by Loan Type</span>
                  <div className="loan-chip-row">
                    {FILTERS.map((filter) => (
                      <button type="button" className={`loan-chip ${typeFilter === filter ? 'active' : ''}`} key={filter} onClick={() => setTypeFilter(typeFilter === filter ? null : filter)}>{filter}</button>
                    ))}
                  </div>
                </div>

                <div className="loan-filter-group compact">
                  <span>Filter by Status</span>
                  <div className="loan-chip-row">
                    {STATUS_FILTERS.map((filter) => (
                      <button type="button" className={`loan-chip ${statusFilter === filter ? 'active' : ''}`} key={filter} onClick={() => setStatusFilter(filter)}>{filter}</button>
                    ))}
                  </div>
                </div>

                <label className="loan-sort">
                  <span>Sort by</span>
                  <div>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="latest">Latest</option>
                      <option value="amount">Amount</option>
                      <option value="status">Status</option>
                    </select>
                    <IconChevronDown size={14} />
                  </div>
                </label>
              </section>

              <div className="loan-section-title">
                {loading ? 'Loading...' : filtered.length === 0 ? 'No applications found' : 'Loan Applications'}
              </div>

              {!loading && filtered.length === 0 && applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  <IconFileText size={48} />
                  <p>No loan applications yet.</p>
                  <button type="button" className="loan-apply-btn" onClick={() => (window.location.hash = '#/apply-loan')} style={{ marginTop: 12 }}>Apply Now</button>
                </div>
              ) : (
                <section className="loan-card-grid" aria-label="Loan applications">
                  {filtered.map((loan) => {
                    const Icon = LOAN_TYPE_ICON[loan.loan_type] || IconFileText
                    const tone = STATUS_TONE[loan.status] || 'slate'
                    return (
                      <article className="loan-card" key={loan.loan_id}>
                        <div className="loan-card-head">
                          <span className={`loan-card-icon ${tone}`}><Icon size={18} /></span>
                          <div className="loan-status-row">
                            <span className={`loan-status ${tone}`}>{STATUS_LABEL[loan.status] || loan.status}<i /></span>
                          </div>
                        </div>
                        <h2>{loan.loan_type || 'Loan Application'}</h2>
                        <dl>
                          <div><dt>Loan ID:</dt><dd>{loan.application_id}</dd></div>
                          <div><dt>Applied:</dt><dd>{timeAgo(loan.created_at)}</dd></div>
                          <div><dt>Amount:</dt><dd>{money(loan.amount)}</dd></div>
                          {loan.tenure_months ? <div><dt>Tenure:</dt><dd>{loan.tenure_months} months</dd></div> : null}
                          {loan.disbursed_at ? <div><dt>Disbursed:</dt><dd>{timeAgo(loan.disbursed_at)}</dd></div> : null}
                        </dl>
                        <button
                          type="button"
                          className="loan-details-btn"
                          onClick={() => {
                            if (loan.status === 'draft') window.location.hash = '#/apply-loan'
                            else window.location.hash = `#/loan/${loan.loan_id}`
                          }}
                        >
                          {loan.status === 'draft' ? 'Continue Draft' : 'View Details'}
                        </button>
                      </article>
                    )
                  })}
                </section>
              )}
            </section>

            <aside className="loan-side">
              <section className="loan-side-card">
                <h2>Recent Activity</h2>
                <div className="loan-activity-list">
                  {activity.length === 0
                    ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No recent activity</p>
                    : activity.map((item, i) => (
                      <div className="loan-activity" key={i}>
                        <span className={`loan-dot ${item.tone}`} />
                        <p>{item.text}<small>{item.time}</small></p>
                      </div>
                    ))
                  }
                </div>
              </section>

              <section className="loan-side-card">
                <h2>Quick Actions</h2>
                <div className="loan-action-list">
                  <button type="button" onClick={() => (window.location.hash = '#/apply-loan')}>
                    <IconEdit size={17} /> Apply Loan
                  </button>
                  <button type="button">
                    <IconUpload size={17} /> Upload Documents
                  </button>
                  <button type="button">
                    <IconMessageCircle size={17} /> Contact Support
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
