import { useEffect, useState } from 'react'
import {
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconDeviceFloppy,
  IconEdit,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
  IconBuildingBank,
  IconId,
  IconFileText,
  IconLoader2,
  IconShieldCheck,
} from '@tabler/icons-react'

import './profile-panel.css'
import { getProfile, submitKyc, updateProfile, updateProfileNotifications } from '../api/profile'

const OVERVIEW_FIELDS = [
  { key: 'first_name', label: 'First name', readOnly: true, icon: IconUser },
  { key: 'last_name', label: 'Last name', readOnly: true, icon: IconUser },
  { key: 'phone_number', label: 'Phone number', readOnly: true, icon: IconPhone },
  { key: 'email', label: 'Email id', readOnly: true, icon: IconMail },
]

const EDITABLE_FIELDS = [
  { key: 'address', label: 'Street', icon: IconMapPin },
  { key: 'gender', label: 'Gender', icon: IconFileText },
  { key: 'dob', label: 'Date of birth', icon: IconFileText },
  { key: 'marital_status', label: 'Marital status', icon: IconFileText },
  { key: 'city', label: 'City', icon: IconMapPin },
  { key: 'state', label: 'State', icon: IconMapPin },
  { key: 'pincode', label: 'Pincode', icon: IconMapPin },
  { key: 'country', label: 'Country', icon: IconMapPin },
  { key: 'occupation', label: 'Occupation', icon: IconUser },
  { key: 'company', label: 'Company', icon: IconBuildingBank },
  { key: 'designation', label: 'Designation', icon: IconFileText },
  { key: 'employment_type', label: 'Employment type', icon: IconFileText },
  { key: 'experience', label: 'Experience', icon: IconFileText },
  { key: 'income', label: 'Income', icon: IconFileText },
  { key: 'bank_name', label: 'Bank name', icon: IconBuildingBank },
  { key: 'account_mask', label: 'Account number / mask', icon: IconBuildingBank },
  { key: 'ifsc_code', label: 'IFSC code', icon: IconBuildingBank },
  { key: 'branch', label: 'Branch', icon: IconBuildingBank },
]

const KYC_FIELDS = [
  { key: 'aadhaar', label: 'Aadhaar', icon: IconId },
  { key: 'pan', label: 'PAN', icon: IconFileText },
]

function initials(profile) {
  const first = profile?.first_name?.[0] || 'A'
  const last = profile?.last_name?.[0] || 'K'
  return `${first}${last}`.toUpperCase()
}

function formatDateTime(value) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status) {
  if (status === 'verified') return 'Verified'
  if (status === 'pending') return 'Pending'
  return 'Add'
}

function statusClass(status) {
  if (status === 'verified') return 'verified'
  if (status === 'pending') return 'pending'
  return 'empty'
}

function maskedAadhaar(last4) {
  return last4 ? `•••• •••• ${last4}` : 'Aadhaar not added'
}

function maskedPan(last4) {
  return last4 ? `•••••${last4}` : 'PAN not added'
}

function compactAddress(parts) {
  return parts.map((part) => `${part || ''}`.trim()).filter(Boolean).join(', ')
}

function getStreetAddress(values) {
  if (values?.street) return `${values.street}`.trim()

  const address = `${values?.address || ''}`.trim()
  if (!address) return ''

  const tail = compactAddress([values?.city, values?.state, values?.pincode, values?.country])
  if (tail && address.toLowerCase().endsWith(tail.toLowerCase())) {
    return address.slice(0, address.length - tail.length).replace(/,\s*$/, '').trim()
  }

  return address
}

export default function ProfilePanel({ isOpen, onClose }) {
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('user_profile')
      if (!cached) return null
      const parsed = JSON.parse(cached)
      // Only expose registration fields from cache to avoid showing unrelated data
      const REG_FIELDS = ['first_name', 'last_name', 'phone_number', 'email', 'completion_percent', 'photo']
      const safe = {}
      REG_FIELDS.forEach((k) => {
        if (parsed[k]) safe[k] = parsed[k]
      })
      return Object.keys(safe).length ? safe : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [fieldValue, setFieldValue] = useState('')
  const [kycField, setKycField] = useState(null)
  const [kycValue, setKycValue] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        if (!cancelled) {
          // Merge only registration fields from cached profile
          let cachedReg = {}
          try {
            const raw = localStorage.getItem('user_profile')
            if (raw) cachedReg = JSON.parse(raw)
          } catch {
            cachedReg = {}
          }
          const REG_FIELDS = ['first_name', 'last_name', 'phone_number', 'email']
          const merged = { ...(data || {}) }
          REG_FIELDS.forEach((k) => {
            if ((!merged[k] || merged[k] === null) && cachedReg[k]) merged[k] = cachedReg[k]
          })
          setProfile(merged)
          localStorage.setItem('user_profile', JSON.stringify(merged))
        }
      } catch (error) {
        if (!cancelled) {
          setToast({ type: 'error', message: error.message || 'Unable to refresh profile' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const saveOverviewField = async () => {
    if (!editingField) return
    setSaving(true)
    try {
      const payload = editingField === 'address'
        ? { street: fieldValue, address: compactAddress([fieldValue, profile?.city, profile?.state, profile?.pincode, profile?.country]) }
        : { [editingField]: fieldValue }
      const data = await updateProfile(payload)
      setProfile(data)
      localStorage.setItem('user_profile', JSON.stringify(data))
      setEditingField(null)
      setFieldValue('')
      setToast({ type: 'success', message: 'Profile updated' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const saveKyc = async () => {
    if (!kycField) return
    setSaving(true)
    try {
      const payload = kycField === 'aadhaar' ? { aadhaar_number: kycValue } : { pan_number: kycValue }
      const data = await submitKyc(payload)
      setProfile(data)
      localStorage.setItem('user_profile', JSON.stringify(data))
      setKycField(null)
      setKycValue('')
      setToast({ type: 'success', message: 'KYC updated' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update KYC' })
    } finally {
      setSaving(false)
    }
  }

  const toggleNotifications = async (key) => {
    if (!profile) return
    setNotificationSaving(true)
    try {
      const data = await updateProfileNotifications({
        sms: key === 'sms' ? !profile.notifications.sms : profile.notifications.sms,
        email: key === 'email' ? !profile.notifications.email : profile.notifications.email,
      })
      setProfile(data)
      localStorage.setItem('user_profile', JSON.stringify(data))
      setToast({ type: 'success', message: 'Notification preferences saved' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to save notifications' })
    } finally {
      setNotificationSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="profile-overlay" role="presentation">
      <button type="button" className="profile-backdrop" aria-label="Close profile panel" onClick={onClose} />

      <aside className="profile-drawer" role="dialog" aria-modal="true" aria-label="User profile panel">
        <header className="profile-header">
          <div>
            <p className="profile-eyebrow">Borrower profile</p>
            <h2>Account center</h2>
          </div>
          <button type="button" className="profile-close" onClick={onClose} aria-label="Close profile panel">
            <IconChevronRight size={18} />
          </button>
        </header>

        {toast ? (
          <div className={`profile-toast ${toast.type}`} role="alert">
            {toast.type === 'error' ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            <span>{toast.message}</span>
          </div>
        ) : null}

        <div className="profile-body">
          {loading ? (
            <div className="profile-loading">
              <div className="profile-skeleton avatar" />
              <div className="profile-skeleton line" />
              <div className="profile-skeleton line short" />
              <div className="profile-skeleton section-block" />
            </div>
          ) : profile ? (
            <>
              <section className="profile-section">
                <div className="profile-section-title">Overview</div>
                  <div className="profile-summary-card">
                    <div className="profile-avatar">{initials(profile)}</div>
                    <div className="profile-summary-copy">
                      <div className="profile-name-row">
                        <h3>{`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}</h3>
                        <span className="profile-verified-badge">
                          <IconShieldCheck size={14} /> Verified borrower
                        </span>
                      </div>
                      <p>Customer · Verified borrower</p>
                      <div className="profile-progress-meta">
                        <span>Profile completion</span>
                        <strong>{profile.completion_percent}%</strong>
                      </div>
                      <div className="profile-progress-bar">
                        <span style={{ width: `${profile.completion_percent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="profile-field-list">
                    <div className="profile-section-title">Registration details</div>
                    {OVERVIEW_FIELDS.map((field) => {
                      const value = field.key === 'address' ? getStreetAddress(profile) : profile[field.key]
                      return (
                        <div key={field.key} className="profile-field-card">
                          <div className="profile-field-row">
                            <div className="profile-field-leading">
                              <span className="profile-field-icon"><field.icon size={15} /></span>
                              <div>
                                <div className="profile-field-label">{field.label}</div>
                                <div className={`profile-field-value ${value ? '' : 'muted'}`}>{value || 'Not added yet'}</div>
                              </div>
                            </div>
                            <div className="profile-field-actions">
                              <span className="profile-inline-badge readonly">Saved</span>
                              <button type="button" className="profile-icon-button" disabled aria-hidden="true">
                                <IconEdit size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="profile-field-list">
                    <div className="profile-section-title">Additional details</div>
                    {EDITABLE_FIELDS.map((field) => {
                      const value = profile[field.key]
                      const empty = !value
                      const isEditing = editingField === field.key
                      return (
                        <div key={field.key} className="profile-field-card">
                          <div className="profile-field-row">
                            <div className="profile-field-leading">
                              <span className="profile-field-icon"><field.icon size={15} /></span>
                              <div>
                                <div className="profile-field-label">{field.label}</div>
                                <div className={`profile-field-value ${empty ? 'muted' : ''}`}>{value || 'Not added yet'}</div>
                              </div>
                            </div>
                            <div className="profile-field-actions">
                              <span className={`profile-inline-badge ${empty ? 'empty' : 'verified'}`}>{empty ? 'Add' : 'Saved'}</span>
                              <button
                                type="button"
                                className="profile-icon-button"
                                onClick={() => {
                                  setEditingField(field.key)
                                  setFieldValue(value || '')
                                }}
                              >
                                <IconEdit size={14} />
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="profile-inline-editor">
                              {field.key === 'gender' ? (
                                <select value={fieldValue} onChange={(event) => setFieldValue(event.target.value)}>
                                  <option value="">Select gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                  <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                              ) : field.key === 'dob' ? (
                                <input type="date" value={fieldValue || ''} onChange={(event) => setFieldValue(event.target.value)} />
                              ) : field.key === 'address' ? (
                                <textarea rows={3} value={fieldValue} onChange={(event) => setFieldValue(event.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
                              ) : (
                                <input type="text" value={fieldValue} onChange={(event) => setFieldValue(event.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
                              )}

                              <div className="profile-inline-actions">
                                <button type="button" className="profile-action-secondary" onClick={() => setEditingField(null)}>
                                  Cancel
                                </button>
                                <button type="button" className="profile-action-primary" onClick={saveOverviewField} disabled={saving}>
                                  {saving ? <IconLoader2 size={14} className="spin" /> : <IconDeviceFloppy size={14} />}
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  <div className="profile-help-text">Add more details later using the edit icons.</div>

                </section>

              <section className="profile-section">
                <div className="profile-section-title">KYC / Docs</div>
                {[
                  { key: 'aadhaar', label: 'Aadhaar', value: profile.aadhaar_last4, status: profile.aadhaar_status, placeholder: 'Enter 12-digit Aadhaar' },
                  { key: 'pan', label: 'PAN', value: profile.pan_last4, status: profile.pan_status, placeholder: 'Enter PAN number' },
                ].map((item) => {
                  const locked = item.status === 'verified'
                  const isEditing = kycField === item.key
                  const FieldIcon = KYC_FIELDS.find((entry) => entry.key === item.key)?.icon || IconId
                  return (
                    <div key={item.key} className="profile-kyc-card">
                      <div className="profile-field-row">
                        <div className="profile-field-leading">
                          <span className="profile-field-icon"><FieldIcon size={15} /></span>
                          <div>
                            <div className="profile-field-label">{item.label}</div>
                            <div className={`profile-field-value ${item.value ? '' : 'muted'}`}>
                              {item.key === 'aadhaar' ? maskedAadhaar(item.value) : maskedPan(item.value)}
                            </div>
                          </div>
                        </div>
                        <div className="profile-field-actions">
                          <span className={`profile-inline-badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                          <button
                            type="button"
                            className="profile-icon-button"
                            disabled={locked}
                            onClick={() => {
                              if (locked) return
                              setKycField(item.key)
                              setKycValue('')
                            }}
                          >
                            <IconEdit size={14} />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="profile-inline-editor">
                          <input
                            type="password"
                            value={kycValue}
                            maxLength={item.key === 'aadhaar' ? 12 : 10}
                            placeholder={item.placeholder}
                            onChange={(event) => setKycValue(event.target.value)}
                          />
                          <div className="profile-inline-actions">
                            <button type="button" className="profile-action-secondary" onClick={() => setKycField(null)}>
                              Cancel
                            </button>
                            <button type="button" className="profile-action-primary" onClick={saveKyc} disabled={saving}>
                              {saving ? <IconLoader2 size={14} className="spin" /> : <IconDeviceFloppy size={14} />}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </section>

              <section className="profile-section">
                <div className="profile-section-title">Security</div>
                <div className="profile-security-card">
                  <div className="profile-field-label">Last login</div>
                  <div className="profile-field-value">{formatDateTime(profile.last_login_at)}</div>
                </div>

                <div className="profile-security-card">
                  <div className="profile-card-title">Notification preferences</div>
                  <div className="profile-toggle-row">
                    <label>
                      <span>SMS</span>
                      <input
                        type="checkbox"
                        checked={Boolean(profile.notifications?.sms)}
                        disabled={notificationSaving}
                        onChange={() => toggleNotifications('sms')}
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="checkbox"
                        checked={Boolean(profile.notifications?.email)}
                        disabled={notificationSaving}
                        onChange={() => toggleNotifications('email')}
                      />
                    </label>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="profile-empty-panel">
              <p>Unable to load profile.</p>
            </div>
          )}
        </div>

        <footer className="profile-footer">
          <div className="profile-help-text">Complete profile to unlock higher limits.</div>
        </footer>
      </aside>
    </div>
  )
}
