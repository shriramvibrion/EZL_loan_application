import { useMemo } from 'react'
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
} from '@tabler/icons-react'
import AppNavbar from '../components/AppNavbar'
import './loan-dashboard.css'
import heroBg from '../../image/img.jpg'

const SUMMARY = [
  { label: 'Total Loans', value: 7, tone: 'violet', icon: IconFileText },
  { label: 'Active Loans', value: 3, tone: 'blue', icon: IconHome },
  { label: 'Pending Loans', value: 2, tone: 'amber', icon: IconClock },
  { label: 'Closed Loans', value: 2, tone: 'green', icon: IconCalendarCheck },
]

const LOANS = [
  {
    type: 'Personal Loan',
    id: 'PL-10245',
    applied: '1 hr',
    requested: '₹25L',
    disbursed: '₹25L',
    status: 'Disbursed',
    tone: 'violet',
    icon: IconUser,
  },
  {
    type: 'Home Loan',
    id: 'HL-30512',
    applied: '1 hr',
    requested: '₹45L',
    review: 'Under Review',
    status: 'Under Review',
    tone: 'blue',
    featured: true,
    icon: IconHome,
  },
  {
    type: 'Vehicle Loan',
    id: 'VL-780103',
    applied: '15 hr',
    requested: '₹12L',
    pending: 'document',
    status: 'Pending',
    secondaryStatus: 'Draft',
    tone: 'amber',
    icon: IconWallet,
  },
  {
    type: 'Education Loan',
    id: 'EL-20917',
    applied: '2 Now',
    requested: '₹15L',
    offer: 'offer sent',
    status: 'Accepted',
    tone: 'green',
    icon: IconBuildingBank,
  },
  {
    type: 'Personal Loan',
    id: 'PL-10201',
    applied: 'Date',
    requested: 'Amount',
    closed: '2 days ago',
    status: 'Closed',
    tone: 'slate',
    icon: IconUser,
  },
  {
    type: 'Home Loan',
    id: 'HL-30112',
    applied: '2 Days',
    requested: 'Incomplete application',
    status: 'Rejected',
    tone: 'red',
    icon: IconHome,
  },
]

const ACTIVITY = [
  { text: 'HL-30512 updated to Under Review', time: '1hr ago', tone: 'blue' },
  { text: 'PL-10201 closed', time: '2 days ago', tone: 'slate' },
  { text: 'HL-30512 updated', time: '3 days ago', tone: 'amber' },
  { text: 'PL-10201 updated', time: '2 days ago', tone: 'slate' },
]

const FILTERS = ['Personal', 'Home', 'Vehicle', 'Education']
const STATUS_FILTERS = ['All', 'Pending']

function titleCase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function getCachedProfile() {
  try {
    const cached = localStorage.getItem('user_profile')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export default function LoanDashboard() {
  const profile = useMemo(() => getCachedProfile(), [])
  const displayName = titleCase(profile?.first_name) || 'Priya'

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
                      <span className={`loan-summary-icon ${item.tone}`}>
                        <Icon size={19} />
                      </span>
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
                    <input type="search" placeholder="Search by Loan ID" />
                  </div>
                </label>

                <div className="loan-filter-group">
                  <span>Filter by Loan Type</span>
                  <div className="loan-chip-row">
                    {FILTERS.map((filter) => (
                      <button type="button" className="loan-chip" key={filter}>{filter}</button>
                    ))}
                  </div>
                </div>

                <div className="loan-filter-group compact">
                  <span>Filter by Status</span>
                  <div className="loan-chip-row">
                    {STATUS_FILTERS.map((filter, index) => (
                      <button type="button" className={`loan-chip ${index === 0 ? 'active' : ''}`} key={filter}>{filter}</button>
                    ))}
                    <button type="button" className="loan-chip icon-only" aria-label="More status filters"><IconDots size={14} /></button>
                  </div>
                </div>

                <label className="loan-sort">
                  <span>Sort by</span>
                  <div>
                    <select defaultValue="latest">
                      <option value="latest">Latest</option>
                      <option value="amount">Amount</option>
                      <option value="status">Status</option>
                    </select>
                    <IconChevronDown size={14} />
                  </div>
                </label>
              </section>

              <div className="loan-section-title">Loan Cards Grid</div>

              <section className="loan-card-grid" aria-label="Loan applications">
                {LOANS.map((loan) => {
                  const Icon = loan.icon
                  return (
                    <article className={`loan-card ${loan.featured ? 'featured' : ''}`} key={loan.id}>
                      <div className="loan-card-head">
                        <span className={`loan-card-icon ${loan.tone}`}>
                          <Icon size={18} />
                        </span>
                        <div className="loan-status-row">
                          {loan.secondaryStatus ? <span className="loan-status muted">{loan.secondaryStatus}</span> : null}
                          <span className={`loan-status ${loan.tone}`}>{loan.status}<i /></span>
                        </div>
                      </div>
                      <h2>{loan.type}</h2>
                      <dl>
                        <div><dt>Loan ID:</dt><dd>{loan.id}</dd></div>
                        <div><dt>Applied Date:</dt><dd>{loan.applied}</dd></div>
                        <div><dt>Requested:</dt><dd>{loan.requested}</dd></div>
                        {loan.disbursed ? <div><dt>Disbursed:</dt><dd>{loan.disbursed}</dd></div> : null}
                        {loan.review ? <div><dt>{loan.review}</dt><dd /></div> : null}
                        {loan.pending ? <div><dt>Pending:</dt><dd>{loan.pending}</dd></div> : null}
                        {loan.closed ? <div><dt>Closed</dt><dd>{loan.closed}</dd></div> : null}
                      </dl>
                      <button type="button" className="loan-details-btn">View Details</button>
                    </article>
                  )
                })}
              </section>
            </section>

            <aside className="loan-side">
              <section className="loan-side-card">
                <h2>Recent Activity</h2>
                <div className="loan-activity-list">
                  {ACTIVITY.map((item) => (
                    <div className="loan-activity" key={`${item.text}-${item.time}`}>
                      <span className={`loan-dot ${item.tone}`} />
                      <p>{item.text}<small>{item.time}</small></p>
                    </div>
                  ))}
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
