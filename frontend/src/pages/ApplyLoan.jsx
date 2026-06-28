import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	IconArrowLeft,
	IconArrowRight,
	IconBriefcase,
	IconBuildingBank,
	IconCamera,
	IconCar,
	IconChartBar,
	IconCheck,
	IconCircleCheck,
	IconCloudUpload,
	IconCreditCard,
	IconDots,
	IconFileCertificate,
	IconFileCheck,
	IconFileText,
	IconHeadset,
	IconHome,
	IconId,
	IconInfoCircle,
	IconLock,
	IconReceipt,
	IconRefresh,
	IconShieldCheck,
	IconSignature,
	IconUser,
	IconUserPlus,
	IconWallet,
} from '@tabler/icons-react'
import AppNavbar from '../components/AppNavbar'
import heroBg from '../../image/img.jpg'
import './apply-loan.css'
import { getLoanDraft, saveLoanDraft, submitLoanApplication, uploadLoanDocument } from '../api/loan'

const TOTAL_STEPS = 15
const TOTAL_CARDS = 16

const STEP_TITLES = [
	'Loan Selection',
	'Loan Information',
	'Applicant Details',
	'Applicant KYC',
	'Income & Employment',
	'Joint Application',
	'Co-Applicant KYC',
	'Co-Applicant Income',
	'Guarantor Details',
	'Guarantor Verification',
	'Guarantor Income Details',
	'Document Upload',
	'Eligibility & Review',
	'Legal Compliance',
	'Final Review & Submission',
	'Application Submitted',
]

const LOAN_TYPES = [
	{ name: 'Personal Loan', copy: 'Instant approval for personal needs, medical emergencies, or travel.', icon: IconUser, popular: true },
	{ name: 'Home Loan', copy: 'Low-interest rates for purchasing a new home or renovation.', icon: IconHome },
	{ name: 'Business Loan', copy: 'Capital for expansion, inventory, or equipment upgrades.', icon: IconBriefcase },
	{ name: 'Vehicle Loan', copy: 'Finance your dream car or two-wheeler with ease.', icon: IconCar },
	{ name: 'Gold Loan', copy: 'Secure quick funding against your gold assets at low rates.', icon: IconWallet },
]

const TENURE_OPTIONS = [12, 24, 36, 48, 60, 84, 120, 180, 240, 360]
const PURPOSE_OPTIONS = ['Medical Emergency', 'Home Renovation', 'Business Expansion', 'Education', 'Travel', 'Wedding', 'Debt Consolidation', 'Vehicle Purchase', 'Other']
const EXPERIENCE_OPTIONS = ['Less than 1 year', '1-2 years', '2-5 years', '5-10 years', '10+ years']

function readCachedProfile() {
	try {
		const cached = localStorage.getItem('user_profile')
		return cached ? JSON.parse(cached) : null
	} catch {
		return null
	}
}

function getInitials(profile) {
	if (!profile) return 'SA'
	return `${(profile.first_name || 'S').slice(0, 1)}${(profile.last_name || 'A').slice(0, 1)}`.toUpperCase()
}

function fullName(profile) {
	return `${profile?.first_name || ''}${profile?.last_name ? ' ' + profile.last_name : ''}`.trim() || 'Applicant'
}

function money(value) {
	return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

function navigate(route) {
	window.location.hash = route
}

function Field({ label, value = '', placeholder = 'Enter details', wide, readOnly, note, onChange }) {
	return (
		<label className={`loan-field ${wide ? 'wide' : ''}`}>
			<span>{label}</span>
			<input
				readOnly={readOnly}
				value={value}
				placeholder={placeholder}
				onChange={onChange ? (e) => onChange(e.target.value) : undefined}
			/>
			{note ? <small>{note}</small> : null}
		</label>
	)
}

function SelectField({ label, value, options = [], onChange }) {
	return (
		<label className="loan-field">
			<span>{label}</span>
			<select value={value || ''} onChange={onChange ? (e) => onChange(e.target.value) : undefined}>
				<option value="">Select...</option>
				{options.map((o) => <option key={o} value={o}>{o}</option>)}
			</select>
		</label>
	)
}

function StepBreadcrumb() {
	return (
		<nav className="loan-step-breadcrumb" aria-label="Breadcrumb">
			<button type="button" onClick={() => navigate('#/information')}>Home</button>
			<span className="loan-step-breadcrumb-sep" aria-hidden="true" />
			<span>Apply Loan</span>
		</nav>
	)
}

function ProgressHeader({ title, subtitle, compact }) {
	return (
		<section className={`loan-flow-head ${compact ? 'compact' : ''}`}>
			<h1>{title}</h1>
			{subtitle ? <p>{subtitle}</p> : null}
		</section>
	)
}

function IconTile({ icon: Icon }) {
	return <span className="loan-icon-tile"><Icon size={22} /></span>
}

function TrustCard({ icon: Icon, title, text }) {
	return (
		<article className="trust-card">
			<IconTile icon={Icon} />
			<div>
				<strong>{title}</strong>
				<p>{text}</p>
			</div>
		</article>
	)
}

function HelpCard({ dark }) {
	return (
		<article className={`loan-help-card ${dark ? 'dark' : ''}`}>
			<IconHeadset size={26} />
			<div>
				<strong>Need help?</strong>
				<p>Our loan experts are available 24/7 to assist with your application.</p>
			</div>
			<button type="button">Contact Support</button>
		</article>
	)
}

function UploadBox({ title, text, action = 'Choose File', tall, onFile }) {
	const ref = useRef()
	return (
		<div className={`upload-box ${tall ? 'tall' : ''}`}>
			<IconCloudUpload size={36} />
			<strong>{title}</strong>
			<small>{text}</small>
			<button type="button" onClick={() => ref.current?.click()}>{action}</button>
			<input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => onFile?.(e.target.files[0])} />
		</div>
	)
}

// ── Step Components ──────────────────────────────────────

function Step1({ form, setForm }) {
	return (
		<>
			<ProgressHeader title="Loan Selection" subtitle="Choose the financial product that fits your current needs." />
			<div className="loan-two-column">
				<section className="loan-card" style={{ padding: '24px' }}>
					<div className="loan-type-round-grid">
						{LOAN_TYPES.map((loan) => {
							const Icon = loan.icon
							const selected = form.loan_type === loan.name
							return (
								<button
									type="button"
									className={`loan-type-round-btn ${selected ? 'selected' : ''}`}
									key={loan.name}
									onClick={() => setForm((f) => ({ ...f, loan_type: loan.name }))}
								>
									<span className="loan-type-round-icon"><Icon size={28} /></span>
									<strong>{loan.name}</strong>
									{loan.popular ? <b className="popular-badge">Popular</b> : null}
									{selected ? <span className="circle-check"><IconCircleCheck size={14} /></span> : null}
								</button>
							)
						})}
					</div>
				</section>
				<aside className="loan-card side-panel">
					<h2>Why Choose Us?</h2>
					<TrustCard icon={IconShieldCheck} title="RBI Regulated" text="We adhere to high standards of financial security and transparency." />
					<TrustCard icon={IconLock} title="256-bit Encrypted" text="Your financial data is protected by bank-grade encryption." />
					<TrustCard icon={IconCircleCheck} title="24-48 hr Approval" text="Quick processing after documentation is verified." />
					<div className="support-mini"><span>SA</span><b>Support agent online</b><small>Need help deciding?</small></div>
				</aside>
			</div>
		</>
	)
}

function Step2({ form, setForm }) {
	const amount = Number(form.amount) || 2500000
	const tenure = Number(form.tenure_months) || 36
	const rate = 10.5
	const monthlyRate = rate / 12 / 100
	const emi = amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1)
	const total = emi * tenure

	return (
		<>
			<ProgressHeader title={<><span>Loan Information</span><em>& Terms</em></>} subtitle="Provide the specifics of your funding requirement. All calculations are real-time and transparent." />
			<div className="loan-two-column terms-layout">
				<section className="loan-card configure-card">
					<div className="card-heading"><IconTile icon={IconFileText} /><h2>Configure Loan</h2></div>
					<div className="amount-row">
						<label>Loan Amount</label>
						<div className="amount-input-wrap">
							<span className="amount-prefix">Rs.</span>
							<input
								type="number"
								className="amount-input"
								min="10000"
								max="5000000"
								step="10000"
								value={amount}
								onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
							/>
						</div>
					</div>
					<input className="loan-range" type="range" min="10000" max="5000000" step="10000" value={amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
					<div className="range-labels"><span>Min: Rs.10K</span><span>Max: Rs.50L</span></div>
					<div className="loan-form-grid">
						<SelectField label="Tenure (Months)" value={String(tenure)} options={TENURE_OPTIONS.map(String)} onChange={(v) => setForm((f) => ({ ...f, tenure_months: Number(v) }))} />
						<SelectField label="Purpose of Loan" value={form.purpose || ''} options={PURPOSE_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, purpose: v }))} />
					</div>
					<div className="trust-strip">
						<span><IconShieldCheck /> RBI Regulated</span>
						<span><IconLock /> 256-bit Secure</span>
						<span><IconCircleCheck /> Quick Approval</span>
						<span><IconHeadset /> 24/7 Support</span>
					</div>
				</section>
				<aside className="summary-card">
					<h2><IconChartBar size={24} /> Loan Summary</h2>
					<dl>
						<div><dt>Interest Rate (P.A.)</dt><dd>{rate}%</dd></div>
						<div><dt>Processing Fee</dt><dd>Rs.999</dd></div>
						<div className="highlight"><dt>Estimated EMI</dt><dd>{money(Math.round(emi))}</dd></div>
					</dl>
					<small>Total Payable Amount</small>
					<strong>{money(Math.round(total))}</strong>
					<div className="mini-bars"><span /><span /><span /><span /><span /><span /></div>
				</aside>
			</div>
		</>
	)
}

function Step3({ form, setForm, profile }) {
	return (
		<>
			<ProgressHeader title={<><span>Confirm your</span><em>Information</em></>} compact />
			<div className="trust-row">
				<span><IconShieldCheck /> RBI Regulated</span>
				<span><IconLock /> 256-bit Encrypted</span>
				<span className="good"><IconCircleCheck /> Profile Complete</span>
			</div>
			<div className="loan-two-column">
				<section>
					<div className="info-alert"><IconInfoCircle size={19} /><b>Automatic Profile Sync</b><span>Your details have been auto-populated from your verified profile to save you time.</span></div>
					<div className="loan-card form-card">
						<h2><IconUser size={22} /> Personal Information</h2>
						<div className="loan-form-grid">
							<Field label="Full Name" value={form.applicant_name || fullName(profile)} readOnly />
							<Field label="Date of Birth" value={form.applicant_dob || profile?.dob || ''} readOnly />
							<Field label="Gender" value={form.applicant_gender || profile?.gender || ''} readOnly />
							<Field label="Mobile Number" value={form.applicant_phone || profile?.phone_number || ''} readOnly />
							<Field label="Email Address" value={form.applicant_email || profile?.email || ''} wide readOnly />
							<Field label="Current Residential Address" value={form.applicant_address || profile?.address || ''} wide readOnly />
						</div>
					</div>
				</section>
				<aside className="loan-stack">
					<div className="mini-summary">
						<small>Selected Loan</small>
						<strong>{(form.loan_type || 'Loan').replace(' Loan', '')} Express</strong>
						<dl><div><dt>Principal</dt><dd>{money(form.amount)}</dd></div><div><dt>Duration</dt><dd>{form.tenure_months || 36} Months</dd></div></dl>
					</div>
					<TrustCard icon={IconCircleCheck} title="Trusted Partner" text="Partnered with 15+ banks and secured by bank-grade protocols." />
					<HelpCard dark />
				</aside>
			</div>
		</>
	)
}

function Step4({ form, setForm }) {
	return (
		<>
			<ProgressHeader title={<><span>Applicant KYC</span><em>Verification</em></>} subtitle="Please provide your identity details and a clear photograph to complete your Know Your Customer process." />
			<div className="kyc-grid">
				<section className="loan-card form-card">
					<div className="card-heading"><IconTile icon={IconId} /><div><h2>Identity Documents</h2><p>Ensure details match your official documents</p></div></div>
					<div className="loan-form-grid one">
						<Field label="Aadhaar Number" value={form.aadhaar_number || ''} placeholder="XXXX XXXX XXXX" note="Verified via OTP" onChange={(v) => setForm((f) => ({ ...f, aadhaar_number: v }))} />
						<Field label="PAN Number" value={form.pan_number || ''} placeholder="Enter 10-digit PAN" note="Automatic validation in progress..." onChange={(v) => setForm((f) => ({ ...f, pan_number: v.toUpperCase() }))} />
					</div>
					<div className="security-note"><IconShieldCheck size={22} /> Your data is encrypted using industry-standard AES-256 protocols.</div>
				</section>
				<section className="loan-card photo-card">
					<div className="card-title-row"><h2>Photograph</h2><span>Required</span></div>
					<div className="photo-upload"><div className="photo-avatar"><IconCamera size={30} /></div><strong>Click to upload photo</strong><small>Format: JPG, PNG - Max: 2MB</small><button type="button">Choose File</button></div>
				</section>
				<div className="status-grid">
					<span className={form.aadhaar_number ? 'verified' : 'pending'}>{form.aadhaar_number ? <><IconCircleCheck /> <b>Aadhaar</b><small>Entered</small></> : <><IconInfoCircle /> <b>Aadhaar</b><small>Required</small></>}</span>
					<span className={form.pan_number ? 'verified' : 'pending'}>{form.pan_number ? <><IconCircleCheck /> <b>PAN Card</b><small>Entered</small></> : <><IconInfoCircle /> <b>PAN Card</b><small>Required</small></>}</span>
				</div>
			</div>
		</>
	)
}

function Step5({ form, setForm, loanId, toast }) {
	const empType = form.employment_type || 'Salaried'

	const handleSalarySlip = async (file) => {
		if (!file || !loanId) return
		try {
			await uploadLoanDocument(loanId, 'salary_slip', file)
			toast('Salary slip uploaded', 'success')
		} catch (err) {
			toast(err.message || 'Upload failed', 'error')
		}
	}

	return (
		<>
			<ProgressHeader title="Income & Employment" />
			<div className="loan-two-column">
				<section className="loan-card form-card">
					<h2>Employment Type</h2>
					<div className="segmented">
						<button type="button" className={empType === 'Salaried' ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, employment_type: 'Salaried' }))}>Salaried</button>
						<button type="button" className={empType === 'Self Employed' ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, employment_type: 'Self Employed' }))}>Self Employed</button>
					</div>
					<div className="loan-form-grid">
						<Field label="Company Name" value={form.company_name || ''} placeholder="Enter employer name" onChange={(v) => setForm((f) => ({ ...f, company_name: v }))} />
						<Field label="Designation" value={form.designation || ''} placeholder="Job title" onChange={(v) => setForm((f) => ({ ...f, designation: v }))} />
						<Field label="Monthly Net Take-Home Pay" value={form.monthly_income || ''} placeholder="0.00" wide onChange={(v) => setForm((f) => ({ ...f, monthly_income: v }))} />
						<SelectField label="Total Experience (Years)" value={form.total_experience || ''} options={EXPERIENCE_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, total_experience: v }))} />
						<SelectField label="Years in Current Company" value={form.current_exp || ''} options={EXPERIENCE_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, current_exp: v }))} />
					</div>
					<UploadBox title="Upload Salary Slips (Last 3 Months)" text="Accepted formats: PDF, JPG, PNG (Max 5MB)" action="Browse Files" onFile={handleSalarySlip} />
				</section>
				<aside className="loan-stack">
					<div className="estimate-card"><small>Eligibility Estimate</small><strong>{form.monthly_income ? money(Number(form.monthly_income) * 60) : '—'}</strong><span>Potential Loan</span><p>Accurate income details ensure higher approval odds.</p></div>
					<TrustCard icon={IconShieldCheck} title="Data Privacy" text="We use banking-grade encryption to protect your financial records." />
					<TrustCard icon={IconInfoCircle} title="Tip" text="Include variable pay if it is fixed in your annual contract." />
					<div className="image-tile">LOMS Verification System</div>
				</aside>
			</div>
		</>
	)
}

function Step6({ form, setForm, co, setCo }) {
	return (
		<>
			<ProgressHeader title="Joint Application" />
			<div className="joint-layout">
				<aside className="loan-card story-card">
					<IconTile icon={IconUserPlus} />
					<h2>Joint Application</h2>
					<p>Adding a co-applicant can increase your chances of loan approval and potentially unlock better interest rates.</p>
					<ul><li>Combined Income Consideration</li><li>Shared Financial Responsibility</li></ul>
					<div className="image-tile">Secure your future together.</div>
				</aside>
				<section className="loan-card empty-card">
					<div className="card-title-row">
						<div><h2>Co-Applicant Details</h2><p>Provide details for the secondary borrower.</p></div>
						<label className="switch">
							<span>Add Co-Applicant</span>
							<input type="checkbox" checked={!!form.has_co_applicant} onChange={(e) => setForm((f) => ({ ...f, has_co_applicant: e.target.checked ? 1 : 0 }))} />
							<i />
						</label>
					</div>
					{!form.has_co_applicant ? (
						<><div className="empty-icon"><IconUserPlus size={44} /></div><p>Switch the toggle above to add a co-applicant to this loan request.</p></>
					) : (
						<div className="loan-form-grid" style={{ marginTop: 16 }}>
							<Field label="Full Name" value={co.full_name || ''} placeholder="Co-applicant full name" onChange={(v) => setCo((c) => ({ ...c, full_name: v }))} />
							<Field label="Relationship" value={co.relationship || ''} placeholder="e.g. Spouse, Parent, Sibling" onChange={(v) => setCo((c) => ({ ...c, relationship: v }))} />
							<Field label="Aadhaar Number" value={co.aadhaar_number || ''} placeholder="XXXX XXXX XXXX" onChange={(v) => setCo((c) => ({ ...c, aadhaar_number: v }))} />
							<Field label="PAN Number" value={co.pan_number || ''} placeholder="ABCDE1234F" onChange={(v) => setCo((c) => ({ ...c, pan_number: v.toUpperCase() }))} />
						</div>
					)}
				</section>
			</div>
		</>
	)
}

function Step7({ co, setCo }) {
	return (
		<>
			<ProgressHeader title="Co-Applicant KYC" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<div className="card-heading"><IconTile icon={IconId} /><div><h2>Identity Verification</h2><p>Please enter the co-applicant's government-issued ID details accurately.</p></div></div>
						<div className="loan-form-grid">
							<Field label="Aadhaar Number (12 Digits)" value={co.aadhaar_number || ''} note="We will send an OTP to the linked mobile number." onChange={(v) => setCo((c) => ({ ...c, aadhaar_number: v }))} />
							<Field label="PAN Number" value={co.pan_number || ''} note="Permanent Account Number as per IT records." onChange={(v) => setCo((c) => ({ ...c, pan_number: v.toUpperCase() }))} />
						</div>
					</div>
					<div className="loan-card form-card">
						<div className="card-heading"><IconTile icon={IconCamera} /><div><h2>Live Photograph</h2><p>Upload a clear passport-sized photo of the co-applicant.</p></div></div>
						<UploadBox tall title="Drag and drop or click to upload" text="Supported formats: JPG, PNG. Ensure the face is clearly visible." />
					</div>
				</section>
				<aside className="loan-stack">
					<div className="tips-card"><h2>Pro Tips</h2><p>Ensure Aadhaar is linked with a valid mobile number.</p><p>Photo background should be a solid light color.</p><p>Co-applicant must be present for video KYC if required.</p></div>
					<TrustCard icon={IconShieldCheck} title="Banking-Grade Security" text="Your data is encrypted using 256-bit SSL technology." />
					<div className="portrait-tile" />
				</aside>
			</div>
		</>
	)
}

function Step8({ co, setCo }) {
	const empType = co.employment_type || 'Salaried'
	return (
		<>
			<ProgressHeader title="Co-Applicant Income" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<h2>Co-Applicant Employment Type</h2>
						<div className="segmented">
							<button type="button" className={empType === 'Salaried' ? 'active' : ''} onClick={() => setCo((c) => ({ ...c, employment_type: 'Salaried' }))}><IconBriefcase size={20} /> Salaried</button>
							<button type="button" className={empType === 'Self Employed' ? 'active' : ''} onClick={() => setCo((c) => ({ ...c, employment_type: 'Self Employed' }))}>Self-Employed</button>
						</div>
					</div>
					<div className="loan-card form-card">
						<div className="loan-form-grid">
							<Field label="Monthly Gross Salary" value={co.monthly_gross || ''} placeholder="0.00" onChange={(v) => setCo((c) => ({ ...c, monthly_gross: v }))} />
							<Field label="Monthly Net (Take-Home)" value={co.monthly_net || ''} placeholder="0.00" onChange={(v) => setCo((c) => ({ ...c, monthly_net: v }))} />
							<Field label="Organization Name" value={co.organization || ''} placeholder="e.g. Global Tech Corp" wide onChange={(v) => setCo((c) => ({ ...c, organization: v }))} />
						</div>
						<h2><IconCircleCheck size={22} /> Other Income Sources</h2>
						<div className="loan-form-grid">
							<Field label="Rental Income (Monthly)" value={co.rental_income || ''} placeholder="0.00" onChange={(v) => setCo((c) => ({ ...c, rental_income: v }))} />
							<Field label="Dividends/Other (Monthly)" value={co.other_income || ''} placeholder="0.00" onChange={(v) => setCo((c) => ({ ...c, other_income: v }))} />
						</div>
					</div>
					<div className="info-alert"><IconInfoCircle size={20} /><span>Income proof required for the next step.</span></div>
				</section>
				<aside className="loan-stack">
					<div className="summary-card small"><small>Co-Applicant Monthly Net</small><strong>{co.monthly_net ? money(co.monthly_net) : '—'}</strong></div>
					<div className="image-tile">Transparency Matters</div>
				</aside>
			</div>
		</>
	)
}

function Step9({ form, setForm, guarantor, setGuarantor }) {
	return (
		<>
			<ProgressHeader title="Guarantor Details" />
			<div className="loan-two-column slim">
				<section className="loan-stack">
					<div className="loan-card toggle-card">
						<IconTile icon={IconUserPlus} />
						<div><h2>Add Guarantor</h2><p>Do you have a person to guarantee your loan repayment?</p></div>
						<label className="switch">
							<input type="checkbox" checked={!!form.has_guarantor} onChange={(e) => setForm((f) => ({ ...f, has_guarantor: e.target.checked ? 1 : 0 }))} />
							<i />
						</label>
					</div>
					<div className="info-panel"><IconInfoCircle size={28} /> A guarantor agrees to pay a debt if the borrower defaults. Adding a strong guarantor can significantly increase approval chances and lower your interest rate.</div>
					{!!form.has_guarantor && (
						<div className="loan-card form-card" style={{ marginTop: 8 }}>
							<h2>Guarantor Personal Information</h2>
							<div className="loan-form-grid">
								<Field label="Full Name" value={guarantor.full_name || ''} placeholder="Guarantor full name" onChange={(v) => setGuarantor((g) => ({ ...g, full_name: v }))} />
								<Field label="Aadhaar Number" value={guarantor.aadhaar_number || ''} placeholder="XXXX XXXX XXXX" onChange={(v) => setGuarantor((g) => ({ ...g, aadhaar_number: v }))} />
								<Field label="PAN Number" value={guarantor.pan_number || ''} placeholder="ABCDE1234F" onChange={(v) => setGuarantor((g) => ({ ...g, pan_number: v.toUpperCase() }))} />
							</div>
						</div>
					)}
				</section>
				<aside className="loan-stack">
					<div className="mini-summary"><h2>Summary</h2><dl><div><dt>Loan Amount</dt><dd>{money(form.amount)}</dd></div><div><dt>Tenure</dt><dd>{form.tenure_months || 36} Months</dd></div></dl></div>
					<div className="image-tile">Securing your future</div>
				</aside>
			</div>
		</>
	)
}

function Step10({ guarantor, setGuarantor }) {
	return (
		<>
			<ProgressHeader title="Guarantor Verification" subtitle="Official KYC Documentation" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<div className="card-heading"><IconTile icon={IconId} /><h2>Identification Documents</h2></div>
						<div className="loan-form-grid one">
							<Field label="Aadhaar Number (UID)" value={guarantor.aadhaar_number || ''} onChange={(v) => setGuarantor((g) => ({ ...g, aadhaar_number: v }))} />
							<Field label="Permanent Account Number (PAN)" value={guarantor.pan_number || ''} onChange={(v) => setGuarantor((g) => ({ ...g, pan_number: v.toUpperCase() }))} />
						</div>
					</div>
					<div className="loan-card form-card">
						<div className="card-heading"><IconTile icon={IconFileText} /><h2>Additional Proofs</h2></div>
						<div className="proof-grid">
							<button type="button">Voter ID <IconCircleCheck /></button>
							<button type="button">Driving License <IconCircleCheck /></button>
						</div>
					</div>
				</section>
				<aside className="loan-card live-card">
					<div className="card-heading"><IconTile icon={IconCamera} /><h2>Live Photo Capture</h2></div>
					<div className="photo-capture"><IconCamera size={44} /><b>Retake Photo</b><small>Ensure face is clearly visible with good lighting.</small></div>
					<div className="security-note"><IconInfoCircle /> A live photo is required for biometric matching.</div>
					<p className="success-line"><span /> Liveness check passed</p>
				</aside>
			</div>
		</>
	)
}

function Step11({ guarantor, setGuarantor }) {
	const empType = guarantor.employment_type || 'Salaried'
	return (
		<>
			<ProgressHeader title="Guarantor Income Details" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<h2>Employment Status</h2>
						<div className="choice-grid">
							<button type="button" className={empType === 'Salaried' ? 'selected' : ''} onClick={() => setGuarantor((g) => ({ ...g, employment_type: 'Salaried' }))}><IconBuildingBank size={30} /><b>Salaried</b><small>Full-time employment with regular pay.</small></button>
							<button type="button" className={empType === 'Self Employed' ? 'selected' : ''} onClick={() => setGuarantor((g) => ({ ...g, employment_type: 'Self Employed' }))}><IconBriefcase size={30} /><b>Self-Employed</b><small>Business owner or independent contractor.</small></button>
						</div>
					</div>
					<div className="loan-card form-card">
						<h2>Income Verification</h2>
						<div className="loan-form-grid">
							<Field label="Annual Gross Income" value={guarantor.annual_income || ''} placeholder="0.00" onChange={(v) => setGuarantor((g) => ({ ...g, annual_income: v }))} />
							<Field label="Monthly Net Pay" value={guarantor.monthly_net || ''} placeholder="0.00" onChange={(v) => setGuarantor((g) => ({ ...g, monthly_net: v }))} />
							<Field label="Employer Name" value={guarantor.employer_name || ''} wide onChange={(v) => setGuarantor((g) => ({ ...g, employer_name: v }))} />
							<SelectField label="Industry" value={guarantor.industry || ''} options={['Financial Services', 'IT & Technology', 'Healthcare', 'Manufacturing', 'Education', 'Other']} onChange={(v) => setGuarantor((g) => ({ ...g, industry: v }))} />
							<Field label="Years at Current Job" value={guarantor.years_at_job || ''} onChange={(v) => setGuarantor((g) => ({ ...g, years_at_job: v }))} />
						</div>
					</div>
				</section>
				<aside className="loan-stack">
					<div className="mini-summary large"><h3>Application Summary</h3><dl><div><dt>Loan Amount</dt><dd>{money(0)}</dd></div><div><dt>Interest Rate</dt><dd>10.5%</dd></div></dl></div>
					<TrustCard icon={IconInfoCircle} title="Why is this needed?" text="A guarantor's income helps us assess the additional security layer for this loan." />
					<div className="image-tile">Institutional Security</div>
				</aside>
			</div>
		</>
	)
}

function Step12({ loanId, documents, setDocuments, toast }) {
	const upload = async (docType, file) => {
		if (!file || !loanId) { toast('Please save your application first', 'error'); return }
		try {
			const res = await uploadLoanDocument(loanId, docType, file)
			setDocuments((prev) => ({ ...prev, [docType]: res.original_name }))
			toast(`${res.original_name} uploaded`, 'success')
		} catch (err) {
			toast(err.message || 'Upload failed', 'error')
		}
	}

	const DocCard = ({ title, text, docType, wide }) => (
		<article className={`doc-card ${wide ? 'wide' : ''}`}>
			<div className="card-title-row">
				<IconTile icon={IconFileText} />
				<span className={documents[docType] ? 'completed' : 'required'}>{documents[docType] ? 'Uploaded' : 'Required'}</span>
			</div>
			<h2>{title}</h2>
			<p>{text}</p>
			{documents[docType]
				? <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4 }}>✓ {documents[docType]}</p>
				: null}
			<UploadBox title="Drop file here" text="PDF, JPG, PNG (Max 5MB)" action={documents[docType] ? 'Replace' : 'Upload'} onFile={(f) => upload(docType, f)} />
		</article>
	)

	return (
		<>
			<ProgressHeader title="Document Upload" />
			<div className="document-layout">
				<aside className="loan-stack">
					<div className="loan-card requirements"><h2>Upload Requirements</h2><p><IconCircleCheck /> Files must be in PDF, JPG, or PNG format.</p><p><IconCircleCheck /> Maximum file size per document is 5MB.</p><p><IconCircleCheck /> Ensure text is clear and readable.</p></div>
					<div className="security-card"><IconShieldCheck size={32} /><h2>Banking-Grade Security</h2><p>Your documents are encrypted and stored in secure, ISO-certified servers.</p></div>
				</aside>
				<section className="doc-grid">
					<DocCard title="Aadhaar Card" text="Front and back scan of your original Aadhaar card." docType="aadhaar_scan" />
					<DocCard title="PAN Card" text="A clear photo or scan of your Permanent Account Number card." docType="pan_scan" />
					<DocCard title="Bank Statements" text="Last 6 months' salary account statements." docType="bank_statement" wide />
					<DocCard title="Passport Photo" text="Recent color photograph with a white background." docType="passport_photo" />
					<DocCard title="Salary Slips" text="Last 3 months' salary slips." docType="salary_slip" />
				</section>
			</div>
		</>
	)
}

function Step13({ form }) {
	const emi = (() => {
		const a = Number(form.amount) || 0
		const t = Number(form.tenure_months) || 36
		const r = 10.5 / 12 / 100
		return Math.round(a * r * Math.pow(1 + r, t) / (Math.pow(1 + r, t) - 1))
	})()
	return (
		<>
			<ProgressHeader title="Eligibility & Review" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="approval-card"><h3><IconCircleCheck /> Preliminary Approval Status</h3><div><span><small>Loan Amount</small><strong>{money(form.amount)}</strong></span><span><small>Monthly EMI</small><strong>{money(emi)}</strong></span></div></div>
					<div className="review-grid">
						<div className="loan-card review-card"><h2><IconFileText /> Loan Summary</h2><dl><div><dt>Product Type</dt><dd>{form.loan_type || '—'}</dd></div><div><dt>Interest Rate</dt><dd>10.5% (P.A.)</dd></div><div><dt>Term</dt><dd>{form.tenure_months || 36} Months</dd></div><div><dt>Estimated EMI</dt><dd>{money(emi)}</dd></div></dl></div>
						<div className="loan-card review-card"><h2><IconUser /> Applicant Summary</h2><b>{form.applicant_name || '—'}</b><small>Primary Borrower</small><dl><div><dt>Employment</dt><dd>{form.employment_type || '—'}</dd></div><div><dt>Monthly Income</dt><dd>{form.monthly_income ? money(form.monthly_income) : '—'}</dd></div></dl></div>
					</div>
				</section>
				<aside className="loan-stack"><div className="tips-card muted"><h3>Next Steps Tip</h3><p>Review all details carefully before proceeding to legal compliance.</p></div></aside>
			</div>
		</>
	)
}

function Step14({ form, setForm }) {
	return (
		<>
			<ProgressHeader title="Legal Compliance" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card legal-card"><h2><IconSignature /> Master Loan Agreement <small>v2.4 Last updated Oct 2023</small></h2><h3>1. Introduction and Definitions</h3><p>This Master Loan Agreement governs the terms of your credit facility. By signing below, you acknowledge that you have read and agreed to the terms herein.</p><h3>2. Disbursement of Funds</h3><p>Upon final approval and verification of all documents, funds will be disbursed to the verified bank account provided during the application process.</p><h3>3. Interest and Repayment</h3></div>
					<div className="loan-card consent-card">
						<label><input type="checkbox" checked={!!form.agreed_terms} onChange={(e) => setForm((f) => ({ ...f, agreed_terms: e.target.checked ? 1 : 0 }))} /><span><b>I accept the Master Loan Agreement</b>I have read and agree to all terms and conditions.</span></label>
						<label><input type="checkbox" checked={!!form.esign_consent} onChange={(e) => setForm((f) => ({ ...f, esign_consent: e.target.checked ? 1 : 0 }))} /><span><b>Electronic Signature Consent</b>I consent to use electronic signatures and receive documents digitally.</span></label>
					</div>
				</section>
				<aside className="loan-stack">
					<div className="summary-card small"><h2><IconFileText /> Final Summary</h2><dl><div><dt>Loan Amount</dt><dd>{money(form.amount)}</dd></div><div><dt>Term</dt><dd>{form.tenure_months || 36} Months</dd></div><div><dt>Interest Rate</dt><dd>10.5%</dd></div></dl></div>
					<div className="loan-card signature-card"><h2>Digital Signature</h2><p>Please draw your signature below or type your full legal name.</p><div className="segmented"><button type="button" className="active">Draw</button><button type="button">Type</button></div><div>Sign here</div><button type="button"><IconRefresh size={18} /> Clear signature</button></div>
				</aside>
			</div>
		</>
	)
}

function Step15({ form, applicationId }) {
	return (
		<>
			<ProgressHeader title="Final Review & Submission" />
			<div className="final-layout">
				<section className="loan-card final-card">
					<div className="card-title-row">
						<span><small>Application Reference</small><strong>{applicationId || 'Pending...'}</strong></span>
						<span className="pending-pill">Pending Final Action</span>
					</div>
					<div className="final-grid">
						<span><small>Applicant Name</small><b>{form.applicant_name || '—'}</b></span>
						<span><small>Loan Type</small><b>{form.loan_type || '—'}</b></span>
						<span><small>Requested Amount</small><strong>{money(form.amount)}</strong></span>
						<span><small>Estimated Term</small><b>{form.tenure_months || 36} Months</b></span>
					</div>
					<h2><IconFileText /> Legal Confirmation</h2>
					<div className="document-list">
						<span>{form.agreed_terms ? '✓ Master Loan Agreement accepted' : '⚠ Terms not accepted'}</span>
						<span>{form.esign_consent ? '✓ E-Sign consent given' : '⚠ E-Sign not consented'}</span>
					</div>
				</section>
				<aside className="loan-stack">
					<div className="loan-card declaration">
						<h3>Final Declaration</h3>
						<p>I hereby certify that all information provided is true, complete, and accurate.</p>
					</div>
					<TrustCard icon={IconHeadset} title="Need help?" text="Contact our 24/7 support before submitting." />
				</aside>
				<div className="info-alert final-note"><IconInfoCircle /> Once submitted, you will no longer be able to edit this application. You can track progress via your dashboard.</div>
			</div>
		</>
	)
}

function SuccessCard({ applicationId }) {
	return (
		<section className="success-layout">
			<div className="success-visual"><div className="vault-art"><IconFileCheck size={134} /></div><span>Security Check</span><span>Encryption <IconLock size={22} /></span></div>
			<div className="success-copy">
				<span className="success-badge"><IconCircleCheck size={18} /> Submission Received</span>
				<h1>Application Submitted Successfully</h1>
				<p>Thank you for choosing us. Your loan application is now being processed. We have sent a confirmation to your registered email address.</p>
				<div className="success-stats">
					<span><small>Application ID</small><b>{applicationId || '—'}</b></span>
					<span><small>Submission Date</small><b>{new Date().toLocaleDateString('en-IN')}</b></span>
					<span className="wide"><small>Current Status</small><b>Submitted — Pending Review</b><em>Est. decision 24–48 Hours</em></span>
				</div>
				<div className="success-actions">
					<button type="button" onClick={() => navigate('#/dashboard')}>Track Application</button>
					<button type="button" onClick={() => navigate('#/dashboard')}>Go To Dashboard</button>
				</div>
			</div>
		</section>
	)
}

// ── Main Component ────────────────────────────────────────

export default function ApplyLoan() {
	const profile = useMemo(() => readCachedProfile(), [])

	// Core loan form state
	const [form, setForm] = useState({
		loan_type: '',
		amount: 2500000,
		tenure_months: 36,
		purpose: '',
		applicant_name: fullName(profile),
		applicant_dob: profile?.dob || '',
		applicant_gender: profile?.gender || '',
		applicant_phone: profile?.phone_number || '',
		applicant_email: profile?.email || '',
		applicant_address: profile?.address || '',
		// Pre-fill KYC from profile
		aadhaar_number: profile?.aadhaar_number || '',
		pan_number: profile?.pan_number || '',
		// Pre-fill employment from profile
		employment_type: profile?.employment_type || 'Salaried',
		company_name: profile?.company || '',
		designation: profile?.designation || '',
		monthly_income: profile?.income || '',
		total_experience: profile?.experience || '',
		current_exp: '',
		has_co_applicant: 0,
		has_guarantor: 0,
		agreed_terms: 0,
		esign_consent: 0,
	})

	const [co, setCo] = useState({})
	const [guarantor, setGuarantor] = useState({})
	const [documents, setDocuments] = useState({})
	const [activeStep, setActiveStep] = useState(0)
	const [loanId, setLoanId] = useState(null)
	const [applicationId, setApplicationId] = useState(null)
	const [saving, setSaving] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [toast, setToastState] = useState(null)
	const toastTimer = useRef(null)

	const showToast = useCallback((message, type = 'success') => {
		setToastState({ message, type })
		clearTimeout(toastTimer.current)
		toastTimer.current = setTimeout(() => setToastState(null), 3500)
	}, [])

	// Load existing draft on mount
	useEffect(() => {
		getLoanDraft().then((res) => {
			if (!res.draft) return
			const d = res.draft
			setLoanId(d.loan_id)
			setApplicationId(d.application_id)
			setActiveStep(d.current_step || 0)
			setForm((f) => ({
				...f,
				loan_type: d.loan_type || f.loan_type,
				amount: d.amount || f.amount,
				tenure_months: d.tenure_months || f.tenure_months,
				purpose: d.purpose || f.purpose,
				applicant_name: d.applicant_name || f.applicant_name,
				applicant_dob: d.applicant_dob || f.applicant_dob,
				applicant_gender: d.applicant_gender || f.applicant_gender,
				applicant_phone: d.applicant_phone || f.applicant_phone,
				applicant_email: d.applicant_email || f.applicant_email,
				applicant_address: d.applicant_address || f.applicant_address,
				aadhaar_number: d.aadhaar_number || '',
				pan_number: d.pan_number || '',
				employment_type: d.employment_type || f.employment_type,
				company_name: d.company_name || '',
				designation: d.designation || '',
				monthly_income: d.monthly_income || '',
				total_experience: d.total_experience || '',
				current_exp: d.current_exp || '',
				has_co_applicant: d.has_co_applicant || 0,
				has_guarantor: d.has_guarantor || 0,
				agreed_terms: d.agreed_terms || 0,
				esign_consent: d.esign_consent || 0,
			}))
			if (d.co_applicant && Object.keys(d.co_applicant).length) setCo(d.co_applicant)
			if (d.guarantor && Object.keys(d.guarantor).length) setGuarantor(d.guarantor)
			if (d.documents?.length) {
				const docMap = {}
				d.documents.forEach((doc) => { docMap[doc.doc_type] = doc.original_name })
				setDocuments(docMap)
			}
		}).catch(() => {})
	}, [])

	// Auto-save draft whenever step changes
	const saveDraft = useCallback(async (step) => {
		setSaving(true)
		try {
			const payload = {
				...form,
				current_step: step,
				co_applicant: Object.keys(co).length ? co : undefined,
				guarantor: Object.keys(guarantor).length ? guarantor : undefined,
			}
			const res = await saveLoanDraft(payload)
			setLoanId(res.loan_id)
			setApplicationId(res.application_id)
		} catch (err) {
			showToast(err.message || 'Auto-save failed', 'error')
		} finally {
			setSaving(false)
		}
	}, [form, co, guarantor, showToast])

	// Dynamic visible steps — skip co-applicant/guarantor steps if not selected
	const visibleCards = useMemo(() => {
		const list = [
			{ idx: 0,  title: 'Loan Selection',             node: <Step1 key="s1" form={form} setForm={setForm} /> },
			{ idx: 1,  title: 'Loan Information',           node: <Step2 key="s2" form={form} setForm={setForm} /> },
			{ idx: 2,  title: 'Applicant Details',          node: <Step3 key="s3" form={form} setForm={setForm} profile={profile} /> },
			{ idx: 3,  title: 'Applicant KYC',              node: <Step4 key="s4" form={form} setForm={setForm} /> },
			{ idx: 4,  title: 'Income & Employment',        node: <Step5 key="s5" form={form} setForm={setForm} loanId={loanId} toast={showToast} /> },
			{ idx: 5,  title: 'Joint Application',          node: <Step6 key="s6" form={form} setForm={setForm} co={co} setCo={setCo} /> },
		]
		if (form.has_co_applicant) {
			list.push({ idx: 6, title: 'Co-Applicant KYC',    node: <Step7 key="s7" co={co} setCo={setCo} /> })
			list.push({ idx: 7, title: 'Co-Applicant Income', node: <Step8 key="s8" co={co} setCo={setCo} /> })
		}
		list.push({ idx: 8, title: 'Guarantor Details', node: <Step9 key="s9" form={form} setForm={setForm} guarantor={guarantor} setGuarantor={setGuarantor} /> })
		if (form.has_guarantor) {
			list.push({ idx: 9,  title: 'Guarantor Verification',   node: <Step10 key="s10" guarantor={guarantor} setGuarantor={setGuarantor} /> })
			list.push({ idx: 10, title: 'Guarantor Income Details', node: <Step11 key="s11" guarantor={guarantor} setGuarantor={setGuarantor} /> })
		}
		list.push({ idx: 11, title: 'Document Upload',          node: <Step12 key="s12" loanId={loanId} documents={documents} setDocuments={setDocuments} toast={showToast} /> })
		list.push({ idx: 12, title: 'Eligibility & Review',     node: <Step13 key="s13" form={form} /> })
		list.push({ idx: 13, title: 'Legal Compliance',         node: <Step14 key="s14" form={form} setForm={setForm} /> })
		list.push({ idx: 14, title: 'Final Review & Submission',node: <Step15 key="s15" form={form} applicationId={applicationId} /> })
		list.push({ idx: 15, title: 'Application Submitted',    node: <SuccessCard key="success" applicationId={applicationId} /> })
		return list
	}, [form, co, guarantor, loanId, documents, applicationId, profile, showToast])

	// Clamp cardIndex if visible cards shrink (e.g. user unchecks co-applicant)
	const safeCardIndex = Math.min(activeStep, visibleCards.length - 1)
	const currentCard = visibleCards[safeCardIndex]
	const isSuccess = safeCardIndex === visibleCards.length - 1
	const isLastRealStep = safeCardIndex === visibleCards.length - 2

	const previous = () => setActiveStep((s) => Math.max(0, s - 1))

	const next = async () => {
		if (isSuccess) return
		if (isLastRealStep) {
			if (!form.agreed_terms) { showToast('Please accept the loan agreement terms', 'error'); return }
			setSubmitting(true)
			try {
				await saveDraft(safeCardIndex)
				const res = await submitLoanApplication()
				setApplicationId(res.application_id)
				setActiveStep(visibleCards.length - 1)
				showToast('Application submitted successfully!', 'success')
			} catch (err) {
				showToast(err.message || 'Submission failed', 'error')
			} finally {
				setSubmitting(false)
			}
		} else {
			const nextIndex = safeCardIndex + 1
			await saveDraft(nextIndex)
			setActiveStep(nextIndex)
		}
	}

	return (
		<main className="loan-apply-page">
			<img className="loan-apply-bg" src={heroBg} alt="" aria-hidden="true" />
			<AppNavbar activePage="apply-loan" />

			{toast ? (
				<div className={`loan-toast loan-toast--${toast.type}`} role="alert">{toast.message}</div>
			) : null}

			{saving ? <div className="loan-autosave-indicator">Saving...</div> : null}

			<div className="loan-apply-shell">
				<section className="loan-apply-panel">
					<StepBreadcrumb />
					<div className={`loan-step-card ${isSuccess ? 'is-success' : ''}`}>
						<div className="loan-step-body">{currentCard?.node}</div>
					</div>
				</section>
			</div>

			<footer className="loan-flow-footer">
				<div>
					<small>{isSuccess ? 'Submitted' : `Step ${safeCardIndex + 1}/${visibleCards.length - 1}`}</small>
					<strong>{currentCard?.title || ''}</strong>
				</div>
				<div>
					<button type="button" className="footer-secondary" disabled={safeCardIndex === 0 || isSuccess} onClick={previous}><IconArrowLeft size={22} /> Previous</button>
					<button type="button" className="footer-primary" disabled={isSuccess || submitting} onClick={next}>
						{submitting ? 'Submitting...' : isLastRealStep ? 'Submit Application' : 'Next'} <IconArrowRight size={22} />
					</button>
				</div>
			</footer>
		</main>
	)
}
