import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IconAlertCircle,
  IconBell,
  IconBadge,
  IconBuildingBank,
  IconDeviceLaptop,
  IconEdit,
  IconEye,
  IconLock,
  IconMail,
  IconMenu2,
  IconPhone,
  IconShieldCheck,
  IconUpload,
  IconUser,
  IconWallet,
} from '@tabler/icons-react'
import './profile.css'
import AppNavbar from '../components/AppNavbar'
import { getProfile, lookupIfsc, updateProfile, uploadProfileDocument } from '../api/profile'

const SIDEBAR_LINKS = [
  { label: 'Dashboard', icon: IconMenu2 },
  { label: 'My Profile', icon: IconUser, active: true },
  { label: 'Loan Applications', icon: IconWallet, href: '#/apply-loan' },
  { label: 'Identity Documents', icon: IconBadge },
  { label: 'Bank Details', icon: IconBuildingBank },
  { label: 'Contact Details', icon: IconPhone },
  { label: 'Notifications', icon: IconBell },
  { label: 'Settings', icon: IconMenu2 },
]

const TABS = [
  { id: 'personal', label: 'Personal', title: 'Personal' },
  { id: 'professional', label: 'Professional Details', title: 'Professional' },
  { id: 'security', label: 'Security', title: 'Security' },
]

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

function getInitials(profile) {
  const first = profile?.first_name?.[0] || 'A'
  const last = profile?.last_name?.[0] || 'J'
  return `${first}${last}`.toUpperCase()
}

function getFullName(profile) {
  return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Borrower profile'
}

function formatDate(value) {
  if (!value) return 'Not available'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return '08-Jun-2026'
  }
}

function getCompletion(profile) {
  if (typeof profile?.completion_percent === 'number') return profile.completion_percent
  const fields = [
    profile?.first_name,
    profile?.last_name,
    profile?.email,
    profile?.phone_number,
    profile?.address,
    profile?.occupation,
    profile?.company,
    profile?.aadhaar_number,
    profile?.pan_number,
    profile?.photo,
  ]
  const filled = fields.filter(Boolean).length
  return Math.max(35, Math.min(100, 20 + filled * 8))
}

function calculateAge(dobValue) {
  if (!dobValue) return ''
  const birthDate = new Date(dobValue)
  if (Number.isNaN(birthDate.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age >= 0 ? age.toString() : ''
}

function getStoredUserId(profile) {
  return profile?.user_id || localStorage.getItem('user_id')
}

function getPhotoStorageKey(profile) {
  const userId = getStoredUserId(profile)
  return userId ? `user_profile_photo_${userId}` : null
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

function toFormValues(values, overrides = {}) {
  const next = { ...(values || {}), ...overrides }
  return {
    ...next,
    street: overrides.street ?? getStreetAddress(next),
    primary_contact_name: next.primary_contact_name || next.emergency_contact_primary_name || '',
    primary_contact_relationship: next.primary_contact_relationship || next.emergency_contact_primary_relationship || '',
    primary_contact_phone: next.primary_contact_phone || next.emergency_contact_primary_phone || '',
    secondary_contact_name: next.secondary_contact_name || next.emergency_contact_secondary_name || '',
    secondary_contact_relationship: next.secondary_contact_relationship || next.emergency_contact_secondary_relationship || '',
    secondary_contact_phone: next.secondary_contact_phone || next.emergency_contact_secondary_phone || '',
  }
}

function toProfilePayload(values) {
  const payload = { ...values }
  const street = values.street
  payload.address = compactAddress([street, values.city, values.state, values.pincode, values.country])
  payload.emergency_contact_primary_name = values.primary_contact_name
  payload.emergency_contact_primary_relationship = values.primary_contact_relationship
  payload.emergency_contact_primary_phone = values.primary_contact_phone
  payload.emergency_contact_secondary_name = values.secondary_contact_name
  payload.emergency_contact_secondary_relationship = values.secondary_contact_relationship
  payload.emergency_contact_secondary_phone = values.secondary_contact_phone
  if (`${payload.aadhaar_number || ''}`.toUpperCase().startsWith('XXXX')) {
    delete payload.aadhaar_number
  }
  if (`${payload.pan_number || ''}`.toUpperCase().startsWith('XXXX')) {
    delete payload.pan_number
  }
  return payload
}

function Field({ label, name, value, icon, onChange, textarea = false, subLabel, className = '', options = [], readOnly = false }) {
  const Icon = icon
  return (
    <div className={`profile-field ${className}`.trim()}>
      <p className="profile-field-label">{label}</p>
      {subLabel ? <p className="profile-field-sublabel">{subLabel}</p> : null}
      <div className="profile-field-value">
        {Icon ? <Icon size={18} className="profile-field-icon" /> : null}
        {textarea ? (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder="Enter details"
            rows={3}
            readOnly={readOnly}
          />
        ) : options.length > 0 ? (
          <select name={name} value={value || ''} onChange={onChange} disabled={readOnly}>
            <option value="" disabled>
              Select {label.toLowerCase()}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder="Enter details"
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [aadhaarFileName, setAadhaarFileName] = useState('')
  const [panFileName, setPanFileName] = useState('')
  const [documentUploading, setDocumentUploading] = useState(null)
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false)
  const [lastLookedUpIfsc, setLastLookedUpIfsc] = useState('')
  const fileRef = useRef(null)
  const aadhaarInputRef = useRef(null)
  const panInputRef = useRef(null)
  const isProfileLocked = Boolean(formValues?.profile_locked)
  const canEditProfile = !isProfileLocked || isEditing
  const hasSavedDob = Boolean(profile?.dob)
  const hasSavedAadhaar = Boolean(profile?.aadhaar_last4 || profile?.aadhaar_number)
  const hasSavedPan = Boolean(profile?.pan_last4 || profile?.pan_number)
  const hasSavedAccountNumber = Boolean(profile?.account_mask)
  const hasSavedIfsc = Boolean(profile?.ifsc_code)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getProfile()
        if (cancelled) return

        // prefer server data but fill missing registration fields from cached registration
        let cachedReg = {}
        try {
          const raw = localStorage.getItem('user_profile')
          if (raw) cachedReg = JSON.parse(raw)
        } catch {
          cachedReg = {}
        }

        // Only reuse explicit registration fields from cache. Do NOT copy other profile fields.
        const REG_FIELDS = ['first_name', 'last_name', 'phone_number', 'email']
        const merged = { ...(data || {}) }
        REG_FIELDS.forEach((k) => {
          if ((!merged[k] || merged[k] === null) && cachedReg[k]) merged[k] = cachedReg[k]
        })
        try {
          localStorage.removeItem('user_profile_photo')
          const photoKey = getPhotoStorageKey(merged)
          const cachedPhoto = photoKey ? localStorage.getItem(photoKey) : null
          if (cachedPhoto) merged.photo = cachedPhoto
        } catch {
          // ignore storage issues
        }
        setProfile(merged)
        setIsEditing(!merged.profile_locked)
        setAadhaarFileName(merged.aadhaar_file_name || '')
        setPanFileName(merged.pan_file_name || '')
        setFormValues(toFormValues({
          ...merged,
          age: merged.age || calculateAge(merged.dob) || '',
          primary_contact_name: merged.primary_contact_name || '',
          primary_contact_relationship: merged.primary_contact_relationship || '',
          primary_contact_phone: merged.primary_contact_phone || '',
          secondary_contact_name: merged.secondary_contact_name || '',
          secondary_contact_relationship: merged.secondary_contact_relationship || '',
          secondary_contact_phone: merged.secondary_contact_phone || '',
        }))
        localStorage.setItem('user_profile', JSON.stringify(merged))
      } catch {
        if (!cancelled) {
          try {
            const cached = localStorage.getItem('user_profile')
            if (cached) {
              const parsed = JSON.parse(cached)
              setProfile(parsed)
              setIsEditing(!parsed.profile_locked)
              setAadhaarFileName(parsed.aadhaar_file_name || '')
              setPanFileName(parsed.pan_file_name || '')
            }
          } catch {
            setProfile(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleInputChange = (field) => (event) => {
    const value = field === 'ifsc_code' ? event.target.value.toUpperCase().replace(/\s/g, '') : event.target.value
    setFormValues((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'dob') {
        next.age = calculateAge(value)
      }
      if (field === 'ifsc_code') {
        next.bank_name = ''
        next.branch = ''
      }
      return next
    })
  }

  const lookupIfscDetails = useCallback(async (showInvalidAlert = true) => {
    const ifscCode = (formValues.ifsc_code || '').trim().toUpperCase()
    if (!ifscCode) return

    if (!IFSC_PATTERN.test(ifscCode)) {
      setFormValues((prev) => ({ ...prev, bank_name: '', branch: '' }))
      if (showInvalidAlert) {
        setToast({ type: 'error', message: 'Wrong IFSC code' })
      }
      return
    }

    if (ifscCode === lastLookedUpIfsc && formValues.bank_name && formValues.branch) {
      return
    }

    setIfscLookupLoading(true)
    try {
      const data = await lookupIfsc(ifscCode)
      const bankName = data.bank_name || ''
      const branch = data.branch || ''

      if (!bankName || !branch) {
        throw new Error('No branch found for this IFSC code')
      }

      setFormValues((prev) => ({
        ...prev,
        ifsc_code: ifscCode,
        bank_name: bankName,
        branch,
      }))
      setLastLookedUpIfsc(ifscCode)
      setToast({ type: 'success', message: 'Bank details auto-filled' })
    } catch (error) {
      setFormValues((prev) => ({ ...prev, bank_name: '', branch: '' }))
      setToast({ type: 'error', message: error.message || 'Wrong IFSC code' })
    } finally {
      setIfscLookupLoading(false)
    }
  }, [formValues.bank_name, formValues.branch, formValues.ifsc_code, lastLookedUpIfsc])

  useEffect(() => {
    const ifscCode = (formValues.ifsc_code || '').trim().toUpperCase()
    if (!canEditProfile) return undefined
    if (ifscCode.length !== 11 || !IFSC_PATTERN.test(ifscCode)) return undefined

    const timer = window.setTimeout(() => {
      void lookupIfscDetails(false)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [formValues.ifsc_code, canEditProfile, lookupIfscDetails])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const payload = toProfilePayload(formValues)
      const data = await updateProfile(payload)
      setProfile(data)
      setIsEditing(false)
      setFormValues(toFormValues({
        ...data,
        street: formValues.street || '',
        primary_contact_name: formValues.primary_contact_name || '',
        primary_contact_relationship: formValues.primary_contact_relationship || '',
        primary_contact_phone: formValues.primary_contact_phone || '',
        secondary_contact_name: formValues.secondary_contact_name || '',
        secondary_contact_relationship: formValues.secondary_contact_relationship || '',
        secondary_contact_phone: formValues.secondary_contact_phone || '',
      }))
      setToast({ type: 'success', message: 'Profile saved' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to save profile' })
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => getInitials(formValues), [formValues])
  const fullName = useMemo(() => getFullName(formValues), [formValues])
  const completion = useMemo(() => getCompletion(formValues), [formValues])
  const customerSince = useMemo(() => formatDate(formValues?.created_at || formValues?.joined_at), [formValues])

  const openPhotoPicker = () => {
    fileRef.current?.click()
  }

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const photo = reader.result
      setProfile((current) => {
        const next = { ...(current || {}), photo }
        try {
          localStorage.removeItem('user_profile_photo')
          const photoKey = getPhotoStorageKey(next)
          if (photoKey) localStorage.setItem(photoKey, photo)
          localStorage.setItem('user_profile', JSON.stringify(next))
        } catch {
          // ignore storage issues
        }
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDocumentChange = async (documentType, file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('file', file)

    setDocumentUploading(documentType)
    try {
      const data = await uploadProfileDocument(formData)
      const updatedProfile = data.profile || {}

      if (documentType === 'aadhaar') {
        setAadhaarFileName(data.file_name || updatedProfile.aadhaar_file_name || '')
      } else {
        setPanFileName(data.file_name || updatedProfile.pan_file_name || '')
      }

      setProfile(updatedProfile)
      setFormValues((current) => ({ ...current, ...updatedProfile }))
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile))
      setToast({ type: 'success', message: `${data.file_name} uploaded` })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to upload document' })
    } finally {
      setDocumentUploading(null)
    }
  }

  return (
    <>
      <AppNavbar activePage="profile" />
      <div className="profile-shell">
      <aside className="profile-sidebar">
        <div className="profile-sidebar-inner">
          <div className="profile-brand-card" data-completion={completion}>
            <div className="profile-avatar-wrapper" onClick={openPhotoPicker} role="button" tabIndex={0} aria-label="Upload profile photo">
              <div className="profile-avatar">
                {profile?.photo ? <img src={profile.photo} alt="Profile" /> : <span>{initials}</span>}
              </div>
              <div className="profile-avatar-overlay">
                <IconEdit size={18} />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="profile-hidden-input" onChange={onPhotoChange} />
            <div className="profile-brand-copy">
              <h2>{fullName}</h2>
              <p>{profile?.company || ''}</p>
            </div>

            <div className="profile-quick-stats">
              <div>
                <span>Customer Since</span>
                <strong>{customerSince}</strong>
              </div>
              <div>
                <span>Account Status</span>
                <strong className="status-active">Active <i /></strong>
              </div>
              <div>
                <span>KYC Status</span>
                <strong>Verified <IconShieldCheck size={14} /></strong>
              </div>
            </div>
          </div>

          <nav className="profile-nav">
            {SIDEBAR_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href || (item.label === 'Dashboard' ? '#/dashboard' : '#')}
                  className={`profile-nav-link ${item.active ? 'active' : ''}`}
                  onClick={(event) => {
                    if (item.href || item.label === 'Dashboard') return
                    event.preventDefault()
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className="profile-page">
        <main className="profile-content" aria-busy={loading}>
          <section className="profile-header-row">
            <div>
              <h2>My Profile</h2>
              <div className="profile-tabs" role="tablist" aria-label="Profile tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-top-actions">
              {canEditProfile ? (
                <button type="button" className="profile-primary-btn" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              ) : (
                <button type="button" className="profile-edit-button" onClick={() => setIsEditing(true)}>
                  <IconEdit size={18} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </section>

          <fieldset className="profile-lock-fieldset">
          {activeTab === 'personal' ? (
            <section className="profile-grid profile-grid-personal">
              <div className="profile-main-column">
                <article className="profile-card profile-card-basic">
                  <div className="profile-card-title-row">
                    <h3>
                      <IconUser size={18} />
                      Basic Information
                    </h3>
                  </div>
                  <div className="profile-grid-two">
                    <label className="profile-input-label">
                      <span>Date of Birth</span>
                      <input
                        type="date"
                        name="dob"
                        value={formValues.dob || ''}
                        onChange={handleInputChange('dob')}
                        placeholder="Select date"
                        disabled={!canEditProfile || hasSavedDob}
                      />
                    </label>
                    <Field
                      label="Age"
                      name="age"
                      value={formValues.age}
                      onChange={handleInputChange('age')}
                      readOnly
                    />
                    <Field
                      label="Gender"
                      name="gender"
                      value={formValues.gender}
                      onChange={handleInputChange('gender')}
                      readOnly={!canEditProfile}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                        { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                      ]}
                    />
                    <Field
                      label="Marital Status"
                      name="marital_status"
                      value={formValues.marital_status}
                      onChange={handleInputChange('marital_status')}
                      readOnly={!canEditProfile}
                      options={[
                        { value: 'single', label: 'Single' },
                        { value: 'married', label: 'Married' },
                        { value: 'divorced', label: 'Divorced' },
                        { value: 'widowed', label: 'Widowed' },
                      ]}
                    />
                  </div>
                </article>

                <article className="profile-card profile-card-contact">
                  <div className="profile-card-title-row">
                    <h3>
                      <IconMail size={18} />
                      Contacts
                    </h3>
                    <span className="profile-badge">Primary Information</span>
                  </div>
                  <div className="profile-grid-two">
                    <Field
                      label="Email ID"
                      name="email"
                      value={formValues.email}
                      onChange={handleInputChange('email')}
                      icon={IconMail}
                      readOnly
                    />
                    <Field
                      label="Mobile Number"
                      name="phone_number"
                      value={formValues.phone_number}
                      onChange={handleInputChange('phone_number')}
                      icon={IconPhone}
                      readOnly
                    />
                    <div className="profile-field profile-field-address">
                      <p className="profile-field-label">Street</p>
                      <div className="profile-address-card">
                        <div>
                          <textarea
                            name="street"
                            value={formValues.street || ''}
                            onChange={handleInputChange('street')}
                            placeholder="Enter street"
                            rows={2}
                            readOnly={!canEditProfile}
                          />
                        </div>
                        <div className="profile-address-grid">
                          <label className="profile-input-label">
                            <span>City</span>
                            <input
                              type="text"
                              name="city"
                              value={formValues.city || ''}
                              onChange={handleInputChange('city')}
                              placeholder="City"
                              readOnly={!canEditProfile}
                            />
                          </label>
                          <label className="profile-input-label">
                            <span>State</span>
                            <select
                              name="state"
                              value={formValues.state || ''}
                              onChange={handleInputChange('state')}
                              disabled={!canEditProfile}
                            >
                              <option value="" disabled>Select state</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Maharashtra">Maharashtra</option>
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Delhi">Delhi</option>
                              <option value="Gujarat">Gujarat</option>
                              <option value="West Bengal">West Bengal</option>
                              <option value="Telangana">Telangana</option>
                              <option value="Andhra Pradesh">Andhra Pradesh</option>
                              <option value="Uttar Pradesh">Uttar Pradesh</option>
                              <option value="Other">Other</option>
                            </select>
                          </label>
                          <label className="profile-input-label">
                            <span>Pincode</span>
                            <input
                              type="text"
                              name="pincode"
                              value={formValues.pincode || ''}
                              onChange={handleInputChange('pincode')}
                              placeholder="Pincode"
                              readOnly={!canEditProfile}
                            />
                          </label>
                          <label className="profile-input-label">
                            <span>Country</span>
                            <select
                              name="country"
                              value={formValues.country || ''}
                              onChange={handleInputChange('country')}
                              disabled={!canEditProfile}
                            >
                              <option value="" disabled>Select country</option>
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="United Arab Emirates">United Arab Emirates</option>
                              <option value="Other">Other</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="profile-card profile-card-emergency">
                  <div className="profile-card-title-row">
                    <h3>
                      <IconPhone size={18} />
                      Emergency Contacts
                    </h3>
                  </div>
                  <div className="profile-emergency-grid">
                    <div className="profile-emergency-box">
                      <span className="profile-mini-caps">Primary Contact</span>
                      <label className="profile-input-label">
                        <span>Name</span>
                        <input
                          type="text"
                          name="primary_contact_name"
                          value={formValues.primary_contact_name || ''}
                          onChange={handleInputChange('primary_contact_name')}
                          placeholder="Name"
                          readOnly={!canEditProfile}
                        />
                      </label>
                      <label className="profile-input-label">
                        <span>Relationship</span>
                        <select
                          name="primary_contact_relationship"
                          value={formValues.primary_contact_relationship || ''}
                          onChange={handleInputChange('primary_contact_relationship')}
                          disabled={!canEditProfile}
                        >
                          <option value="" disabled>Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Friend">Friend</option>
                          <option value="Colleague">Colleague</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label className="profile-input-label">
                        <span>Phone</span>
                        <input
                          type="text"
                          name="primary_contact_phone"
                          value={formValues.primary_contact_phone || ''}
                          onChange={handleInputChange('primary_contact_phone')}
                          placeholder="Phone"
                          readOnly={!canEditProfile}
                        />
                      </label>
                    </div>
                    <div className="profile-emergency-box">
                      <span className="profile-mini-caps">Secondary Contact</span>
                      <label className="profile-input-label">
                        <span>Name</span>
                        <input
                          type="text"
                          name="secondary_contact_name"
                          value={formValues.secondary_contact_name || ''}
                          onChange={handleInputChange('secondary_contact_name')}
                          placeholder="Name"
                          readOnly={!canEditProfile}
                        />
                      </label>
                      <label className="profile-input-label">
                        <span>Relationship</span>
                        <select
                          name="secondary_contact_relationship"
                          value={formValues.secondary_contact_relationship || ''}
                          onChange={handleInputChange('secondary_contact_relationship')}
                          disabled={!canEditProfile}
                        >
                          <option value="" disabled>Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Friend">Friend</option>
                          <option value="Colleague">Colleague</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label className="profile-input-label">
                        <span>Phone</span>
                        <input
                          type="text"
                          name="secondary_contact_phone"
                          value={formValues.secondary_contact_phone || ''}
                          onChange={handleInputChange('secondary_contact_phone')}
                          placeholder="Phone"
                          readOnly={!canEditProfile}
                        />
                      </label>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {activeTab === 'personal' ? (
            <>
              <article className="profile-card profile-card-kyc">
                <div className="profile-card-title-row">
                  <h3>
                    <IconShieldCheck size={18} />
                    KYC Informations
                  </h3>
                </div>
                <div className="profile-kyc-grid">
                  <div className="profile-kyc-row">
                    <div className="profile-kyc-header">
                      <div className="profile-kyc-icon green">
                        <IconBadge size={18} />
                      </div>
                      <div>
                        <strong className="profile-kyc-title">Aadhaar Number</strong>
                      </div>
                    </div>
                    <div className="profile-kyc-entry">
                      <label className="profile-input-label">                        <input
                          type="text"
                          name="aadhaar_number"
                          value={formValues.aadhaar_number || ''}
                          onChange={handleInputChange('aadhaar_number')}
                          placeholder="XXXX XXXX XXXX"
                          readOnly={!canEditProfile || hasSavedAadhaar}
                        />
                      </label>
                      <div className="profile-kyc-actions">
                        {!aadhaarFileName && documentUploading !== 'aadhaar' ? (
                          <label className="profile-upload-btn" htmlFor="aadhaar-upload" aria-label="Upload Aadhaar document">
                            <IconUpload size={18} />
                          </label>
                        ) : null}
                        <input
                          ref={aadhaarInputRef}
                          id="aadhaar-upload"
                          type="file"
                          accept="image/*,.pdf"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              void handleDocumentChange('aadhaar', file)
                            }
                            e.target.value = ''
                          }}
                        />
                        {aadhaarFileName || documentUploading === 'aadhaar' ? (
                          <>
                            <span className="profile-upload-name">
                              {documentUploading === 'aadhaar' ? 'Uploading...' : aadhaarFileName}
                            </span>
                            <button
                              type="button"
                              className="profile-edit-upload-btn"
                              aria-label="Edit Aadhaar document"
                              disabled={documentUploading === 'aadhaar'}
                              onClick={() => aadhaarInputRef.current?.click()}
                            >
                              <IconEdit size={18} />
                            </button>
                          </>
                        ) : null}
                      </div>
                      {aadhaarFileName ? (
                        <button type="button" className="profile-view-doc-btn" aria-label="View Aadhaar document">
                          <IconEye size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="profile-kyc-row">
                    <div className="profile-kyc-header">
                      <div className="profile-kyc-icon green">
                        <IconBadge size={18} />
                      </div>
                      <div>
                        <strong className="profile-kyc-title">PAN Number</strong>
                      </div>
                    </div>
                    <div className="profile-kyc-entry">
                      <label className="profile-input-label">
                        <input
                          type="text"
                          name="pan_number"
                          value={formValues.pan_number || ''}
                          onChange={handleInputChange('pan_number')}
                          placeholder="ABCDE1234F"
                          readOnly={!canEditProfile || hasSavedPan}
                        />
                      </label>
                      <div className="profile-kyc-actions">
                        {!panFileName && documentUploading !== 'pan' ? (
                          <label className="profile-upload-btn" htmlFor="pan-upload" aria-label="Upload PAN document">
                            <IconUpload size={18} />
                          </label>
                        ) : null}
                        <input
                          ref={panInputRef}
                          id="pan-upload"
                          type="file"
                          accept="image/*,.pdf"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              void handleDocumentChange('pan', file)
                            }
                            e.target.value = ''
                          }}
                        />
                        {panFileName || documentUploading === 'pan' ? (
                          <>
                            <span className="profile-upload-name">
                              {documentUploading === 'pan' ? 'Uploading...' : panFileName}
                            </span>
                            <button
                              type="button"
                              className="profile-edit-upload-btn"
                              aria-label="Edit PAN document"
                              disabled={documentUploading === 'pan'}
                              onClick={() => panInputRef.current?.click()}
                            >
                              <IconEdit size={18} />
                            </button>
                          </>
                        ) : null}
                      </div>
                      {panFileName ? (
                        <button type="button" className="profile-view-doc-btn" aria-label="View PAN document">
                          <IconEye size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>

              <article className="profile-card profile-card-bank">
                <div className="profile-card-title-row">
                  <h3>
                    <IconBuildingBank size={18} />
                    Bank Details
                  </h3>
                  <span className="profile-bank-note">Primary Disbursement Account</span>
                </div>
                <div className="profile-bank-grid">
                  <label className="profile-input-label">
                    <span>Account Number</span>
                    <input
                      type="text"
                      name="account_mask"
                      value={formValues.account_mask || ''}
                      onChange={handleInputChange('account_mask')}
                      placeholder="Account number"
                      readOnly={!canEditProfile || hasSavedAccountNumber}
                    />
                  </label>
                  <label className="profile-input-label">
                    <span>IFSC Code</span>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formValues.ifsc_code || ''}
                      onChange={handleInputChange('ifsc_code')}
                      onBlur={() => {
                        if (canEditProfile && !hasSavedIfsc) void lookupIfscDetails(true)
                      }}
                      maxLength={11}
                      placeholder={ifscLookupLoading ? 'Checking IFSC...' : 'IFSC code'}
                      readOnly={!canEditProfile || hasSavedIfsc}
                    />
                  </label>
                  <label className="profile-input-label">
                    <span>Bank Name</span>
                    <input
                      type="text"
                      name="bank_name"
                      value={formValues.bank_name || ''}
                      readOnly
                      placeholder="Auto-filled"
                    />
                  </label>
                  <label className="profile-input-label">
                    <span>Branch</span>
                    <input
                      type="text"
                      name="branch"
                      value={formValues.branch || ''}
                      readOnly
                      placeholder="Auto-filled"
                    />
                  </label>
                </div>
              </article>

              <div className="profile-footer-grid">
                <article className="profile-help-card">
                  <div className="profile-help-icon">
                    <IconAlertCircle size={32} />
                  </div>
                  <div className="profile-help-copy">
                    <h3>Need help with your profile?</h3>
                    <p>Our support team is available 24/7 to assist with identity verification and account setup.</p>
                  </div>
                  <button type="button" className="profile-support-btn">Contact Support</button>
                </article>

                <article className="profile-secure-card">
                  <IconLock size={18} />
                  <p>DATA ENCRYPTED &amp; SECURED</p>
                </article>
              </div>
            </>
          ) : null}

          {activeTab === 'professional' ? (
            <section className="profile-professional-view">
              <article className="profile-card">
                <div className="profile-card-title-row">
                  <h3>
                    <IconWallet size={18} />
                    Employment &amp; Income
                  </h3>
                </div>
                <div className="profile-grid-three">
                  <Field
                    label="Occupation"
                    name="occupation"
                    value={formValues.occupation}
                    onChange={handleInputChange('occupation')}
                    readOnly={!canEditProfile}
                  />
                  <Field
                    label="Company Name"
                    name="company"
                    value={formValues.company}
                    onChange={handleInputChange('company')}
                    readOnly={!canEditProfile}
                  />
                  <Field
                    label="Designation"
                    name="designation"
                    value={formValues.designation}
                    onChange={handleInputChange('designation')}
                    readOnly={!canEditProfile}
                  />
                  <Field
                    label="Employment Type"
                    name="employment_type"
                    value={formValues.employment_type}
                    onChange={handleInputChange('employment_type')}
                    readOnly={!canEditProfile}
                    options={[
                      { value: 'full_time', label: 'Full Time' },
                      { value: 'part_time', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'freelance', label: 'Freelance' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <Field
                    label="Work Experience"
                    name="experience"
                    value={formValues.experience}
                    onChange={handleInputChange('experience')}
                    readOnly={!canEditProfile}
                  />
                  <Field
                    label="Monthly Income"
                    name="income"
                    value={formValues.income}
                    onChange={handleInputChange('income')}
                    className="highlight-money"
                    readOnly={!canEditProfile}
                  />
                </div>
              </article>
              <article className="profile-card profile-professional-note">
                <div>
                  <h3>Update Professional Info?</h3>
                  <p>Changes to income may require fresh bank statement verification.</p>
                </div>
                <button type="button" className="profile-secondary-btn">Update Details</button>
              </article>
            </section>
          ) : null}

          {activeTab === 'security' ? (
            <section className="profile-security-view">
              <article className="profile-card">
                <div className="profile-card-title-row">
                  <h3>
                    <IconLock size={18} />
                    Change Password
                  </h3>
                </div>
                <div className="profile-password-grid">
                  <label>
                    <span>Current Password</span>
                    <input type="password" placeholder="••••••••" />
                  </label>
                  <label>
                    <span>New Password</span>
                    <input type="password" placeholder="••••••••" />
                  </label>
                </div>
                <button type="button" className="profile-primary-btn">Update Password</button>
              </article>

              <div className="profile-security-grid">
                <article className="profile-card">
                  <div className="profile-card-title-row">
                    <h3>
                      <IconShieldCheck size={18} />
                      Two Factor Authentication
                    </h3>
                  </div>
                  <div className="profile-toggle-row">
                    <div>
                      <strong>Authenticator App</strong>
                      <p>Enabled</p>
                    </div>
                    <div className="profile-toggle-pill on">
                      <span />
                    </div>
                  </div>
                </article>

                <article className="profile-card">
                  <div className="profile-card-title-row">
                    <h3>
                      <IconDeviceLaptop size={18} />
                      Active Sessions
                    </h3>
                  </div>
                  <div className="profile-session-row">
                    <div>
                      <strong>MacBook Pro • Chrome</strong>
                      <p>Current Session • Bangalore, India</p>
                    </div>
                  </div>
                  <button type="button" className="profile-danger-btn">Log out of all other devices</button>
                </article>
              </div>

              <article className="profile-card">
                <div className="profile-card-title-row">
                  <h3>
                    <IconBell size={18} />
                    Login History
                  </h3>
                </div>
                <div className="profile-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Device</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>24 Oct, 10:45 AM</td>
                        <td>iPhone 15 Pro</td>
                        <td>Mumbai, India</td>
                        <td className="success">Success</td>
                      </tr>
                      <tr>
                        <td>22 Oct, 09:12 PM</td>
                        <td>Windows PC</td>
                        <td>Bangalore, India</td>
                        <td className="success">Success</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : null}
          </fieldset>
        </main>
      </div>
    </div>
    </>
  )
}

