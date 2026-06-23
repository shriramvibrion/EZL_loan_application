import { useMemo, useState } from 'react'
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

const DOCS = [
	{ title: 'Aadhaar Card', text: 'Front and back scan of your original Aadhaar card.', status: 'Completed', icon: IconId, action: 'aadhaar_scan.pdf' },
	{ title: 'PAN Card', text: 'A clear photo or scan of your Permanent Account Number card.', status: 'Required', icon: IconCreditCard, action: 'Upload PAN' },
	{ title: 'Bank Statements', text: "Last 6 months' salary account statements. Higher processing limit if provided.", status: 'Optional', icon: IconWallet, action: 'Drag and drop files here', wide: true },
	{ title: 'Passport Photo', text: 'Recent color photograph with a white background.', status: 'Required', icon: IconUser, action: 'Take Photo' },
	{ title: 'Other Documents', text: 'Salary slips, rent agreements, or utility bills for address proof.', status: 'Optional', icon: IconDots, action: 'Add More' },
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
	if (!profile) return 'SA'
	return `${(profile.first_name || 'S').slice(0, 1)}${(profile.last_name || 'A').slice(0, 1)}`.toUpperCase()
}

function fullName(profile) {
	return `${profile?.first_name || 'Samuel'} ${profile?.last_name || 'Alexander'}`.trim()
}

function money(value) {
	return `Rs. ${Number(value).toLocaleString('en-IN')}`
}

function navigate(route) {
	window.location.hash = route
}

function Field({ label, value = '', placeholder = 'Enter details', wide, readOnly, note }) {
	return (
		<label className={`loan-field ${wide ? 'wide' : ''}`}>
			<span>{label}</span>
			<input readOnly={readOnly} defaultValue={value} placeholder={placeholder} />
			{note ? <small>{note}</small> : null}
		</label>
	)
}

function SelectField({ label, value }) {
	return (
		<label className="loan-field">
			<span>{label}</span>
			<select defaultValue={value}>
				<option>{value}</option>
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

function UploadBox({ title, text, action = 'Choose File', tall }) {
	return (
		<div className={`upload-box ${tall ? 'tall' : ''}`}>
			<IconCloudUpload size={36} />
			<strong>{title}</strong>
			<small>{text}</small>
			<button type="button">{action}</button>
		</div>
	)
}

function Step1({ selectedLoan, setSelectedLoan }) {
	return (
		<>
			<ProgressHeader title="Loan Selection" subtitle="Choose the financial product that fits your current needs." />
			<div className="loan-two-column">
				<section className="loan-stack">
					{LOAN_TYPES.map((loan) => {
						const Icon = loan.icon
						const selected = selectedLoan === loan.name
						return (
							<button type="button" className={`selection-card ${selected ? 'selected' : ''}`} key={loan.name} onClick={() => setSelectedLoan(loan.name)}>
								<IconTile icon={Icon} />
								<span>
									<strong>{loan.name}</strong>
									{loan.popular ? <b>Popular</b> : null}
									<small>{loan.copy}</small>
									<em>Eligibility Summary</em>
								</span>
							</button>
						)
					})}
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

function Step2({ amount, setAmount }) {
	const emi = 4250
	return (
		<>
			<ProgressHeader title={<><span>Loan Information</span><em>& Terms</em></>} subtitle="Provide the specifics of your funding requirement. All calculations are real-time and transparent." />
			<div className="loan-two-column terms-layout">
				<section className="loan-card configure-card">
					<div className="card-heading"><IconTile icon={IconFileText} /><h2>Configure Loan</h2></div>
					<div className="amount-row">
						<label>Loan Amount</label>
						<strong>{money(amount)}</strong>
					</div>
					<input className="loan-range" type="range" min="10000" max="5000000" step="10000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
					<div className="range-labels"><span>Min: Rs.10K</span><span>Max: Rs.50L</span></div>
					<div className="loan-form-grid">
						<SelectField label="Tenure (Months)" value="36 Months" />
						<SelectField label="Purpose of Loan" value="Business Expansion" />
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
						<div><dt>Interest Rate (P.A.)</dt><dd>10.5%</dd></div>
						<div><dt>Processing Fee</dt><dd>Rs.999</dd></div>
						<div className="highlight"><dt>Estimated EMI</dt><dd>{money(emi)}</dd></div>
					</dl>
					<small>Total Payable Amount</small>
					<strong>{money(3060000)}</strong>
					<div className="mini-bars"><span /><span /><span /><span /><span /><span /></div>
				</aside>
			</div>
		</>
	)
}

function Step3({ profile, selectedLoan, amount }) {
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
							<Field label="Full Name" value={fullName(profile)} readOnly />
							<Field label="Date of Birth" value={profile?.dob || '14 May 1988'} readOnly />
							<Field label="Gender" value={profile?.gender || 'Male'} readOnly />
							<Field label="Mobile Number" value={profile?.phone_number || '+91 9876543210'} readOnly />
							<Field label="Email Address" value={profile?.email || 'samuel.alex@example.com'} wide readOnly />
							<Field label="Current Residential Address" value={profile?.address || 'Flat 402, Skyline Residency, HSR Layout Sector 2, Bengaluru, Karnataka - 560102'} wide readOnly />
						</div>
					</div>
				</section>
				<aside className="loan-stack">
					<div className="mini-summary">
						<small>Selected Loan</small>
						<strong>{selectedLoan.replace(' Loan', '')} Express</strong>
						<dl><div><dt>Principal</dt><dd>{money(amount)}</dd></div><div><dt>Duration</dt><dd>36 Months</dd></div></dl>
					</div>
					<TrustCard icon={IconCircleCheck} title="Trusted Partner" text="Partnered with 15+ banks and secured by bank-grade protocols." />
					<HelpCard dark />
				</aside>
			</div>
		</>
	)
}

function Step4() {
	return (
		<>
			<ProgressHeader title={<><span>Applicant KYC</span><em>Verification</em></>} subtitle="Please provide your identity details and a clear photograph to complete your Know Your Customer process." />
			<div className="kyc-grid">
				<section className="loan-card form-card">
					<div className="card-heading"><IconTile icon={IconId} /><div><h2>Identity Documents</h2><p>Ensure details match your official documents</p></div></div>
					<div className="loan-form-grid one">
						<Field label="Aadhaar Number" value="XXXX XXXX 8921" note="Verified via OTP" />
						<Field label="PAN Number" placeholder="Enter 10-digit PAN" note="Automatic validation in progress..." />
					</div>
					<div className="security-note"><IconShieldCheck size={22} /> Your data is encrypted using industry-standard AES-256 protocols.</div>
				</section>
				<section className="loan-card photo-card">
					<div className="card-title-row"><h2>Photograph</h2><span>Required</span></div>
					<div className="photo-upload"><div className="photo-avatar"><IconCamera size={30} /></div><strong>Click to upload photo</strong><small>Format: JPG, PNG - Max: 2MB</small><button type="button">Choose File</button></div>
				</section>
				<div className="status-grid">
					<span className="verified"><IconCircleCheck /> <b>Aadhaar</b><small>Verified</small></span>
					<span className="pending"><IconInfoCircle /> <b>PAN Card</b><small>Under Verification</small></span>
				</div>
			</div>
		</>
	)
}

function Step5() {
	return (
		<>
			<ProgressHeader title="Income & Employment" />
			<div className="loan-two-column">
				<section className="loan-card form-card">
					<h2>Employment Type</h2>
					<div className="segmented"><button type="button">Salaried</button><button type="button" className="active">Self Employed</button></div>
					<div className="loan-form-grid">
						<Field label="Company Name" placeholder="Enter employer name" />
						<Field label="Designation" placeholder="Job title" />
						<Field label="Monthly Net Take-Home Pay" placeholder="0.00" wide />
						<SelectField label="Total Experience (Years)" value="Select years" />
						<SelectField label="Years in Current Company" value="Select years" />
					</div>
					<UploadBox title="Upload Salary Slips (Last 3 Months)" text="Accepted formats: PDF, JPG, PNG (Max 5MB)" action="Browse Files" />
				</section>
				<aside className="loan-stack">
					<div className="estimate-card"><small>Eligibility Estimate</small><strong>$425,000</strong><span>Potential Loan</span><p>Accurate income details ensure higher approval odds.</p></div>
					<TrustCard icon={IconShieldCheck} title="Data Privacy" text="We use banking-grade encryption to protect your financial records." />
					<TrustCard icon={IconInfoCircle} title="Tip" text="Include variable pay if it is fixed in your annual contract." />
					<div className="image-tile">LOMS Verification System</div>
				</aside>
			</div>
		</>
	)
}

function Step6() {
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
					<div className="card-title-row"><div><h2>Co-Applicant Details</h2><p>Provide details for the secondary borrower.</p></div><label className="switch"><span>Add Co-Applicant</span><input type="checkbox" /><i /></label></div>
					<div className="empty-icon"><IconUserPlus size={44} /></div>
					<p>Switch the toggle above to add a co-applicant to this loan request.</p>
				</section>
			</div>
		</>
	)
}

function Step7() {
	return (
		<>
			<ProgressHeader title="Co-Applicant KYC" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<div className="card-heading"><IconTile icon={IconId} /><div><h2>Identity Verification</h2><p>Please enter the co-applicant's government-issued ID details accurately.</p></div></div>
						<div className="loan-form-grid">
							<Field label="Aadhaar Number (12 Digits)" value="0000 0000 0000" note="We will send an OTP to the linked mobile number." />
							<Field label="PAN Number" value="ABCDE1234F" note="Permanent Account Number as per IT records." />
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

function Step8() {
	return (
		<>
			<ProgressHeader title="Co-Applicant Income" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card">
						<h2>Co-Applicant Employment Type</h2>
						<div className="segmented"><button type="button" className="active"><IconBriefcase size={20} /> Salaried</button><button type="button">Self-Employed</button></div>
					</div>
					<div className="loan-card form-card">
						<div className="loan-form-grid">
							<Field label="Monthly Gross Salary" value="$ 0.00" />
							<Field label="Monthly Net (Take-Home)" value="$ 0.00" />
							<Field label="Organization Name" placeholder="e.g. Global Tech Corp" wide />
						</div>
						<h2><IconCircleCheck size={22} /> Other Income Sources</h2>
						<div className="loan-form-grid">
							<Field label="Rental Income (Monthly)" value="$ 0.00" />
							<Field label="Dividends/Other (Monthly)" value="$ 0.00" />
						</div>
					</div>
					<div className="info-alert"><IconInfoCircle size={20} /><span>Income proof required for the next step.</span></div>
				</section>
				<aside className="loan-stack">
					<div className="summary-card small"><small>Estimated Loan Amount</small><strong>$450,000</strong><dl><div><dt>Primary Income</dt><dd>$8,500/mo</dd></div><div><dt>Applicant Name</dt><dd>Sarah Johnson</dd></div></dl></div>
					<div className="image-tile">Transparency Matters</div>
				</aside>
			</div>
		</>
	)
}

function Step9() {
	return (
		<>
			<ProgressHeader title="Guarantor Details" />
			<div className="loan-two-column slim">
				<section className="loan-stack">
					<div className="loan-card toggle-card"><IconTile icon={IconUserPlus} /><div><h2>Add Guarantor</h2><p>Do you have a person to guarantee your loan repayment?</p></div><label className="switch"><input type="checkbox" /><i /></label></div>
					<div className="info-panel"><IconInfoCircle size={28} /> A guarantor agrees to pay a debt if the borrower defaults. Adding a strong guarantor can significantly increase approval chances and lower your interest rate.</div>
				</section>
				<aside className="loan-stack">
					<div className="mini-summary"><h2>Summary</h2><dl><div><dt>Loan Amount</dt><dd>$45,000</dd></div><div><dt>Tenure</dt><dd>60 Months</dd></div><div><dt>Approval Odds</dt><dd className="green">High</dd></div></dl></div>
					<div className="image-tile">Securing your future</div>
				</aside>
			</div>
		</>
	)
}

function Step10() {
	return (
		<>
			<ProgressHeader title="Guarantor Verification" subtitle="Official KYC Documentation" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card"><div className="card-heading"><IconTile icon={IconId} /><h2>Identification Documents</h2></div><div className="loan-form-grid one"><Field label="Aadhaar Number (UID)" value="5482 1192 4832" /><Field label="Permanent Account Number (PAN)" value="BRDPK9921Z" /></div></div>
					<div className="loan-card form-card"><div className="card-heading"><IconTile icon={IconFileText} /><h2>Additional Proofs</h2></div><div className="proof-grid"><button type="button">Voter ID <IconCircleCheck /></button><button type="button">Driving License <IconCircleCheck /></button></div></div>
				</section>
				<aside className="loan-card live-card"><div className="card-heading"><IconTile icon={IconCamera} /><h2>Live Photo Capture</h2></div><div className="photo-capture"><IconCamera size={44} /><b>Retake Photo</b><small>Ensure face is clearly visible with good lighting.</small></div><div className="security-note"><IconInfoCircle /> A live photo is required for biometric matching.</div><p className="success-line"><span /> Liveness check passed</p></aside>
			</div>
		</>
	)
}

function Step11() {
	return (
		<>
			<ProgressHeader title="Guarantor Income Details" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card form-card"><h2>Employment Status</h2><div className="choice-grid"><button type="button" className="selected"><IconBuildingBank size={30} /><b>Salaried</b><small>Full-time employment with regular pay.</small></button><button type="button"><IconBriefcase size={30} /><b>Self-Employed</b><small>Business owner or independent contractor.</small></button></div></div>
					<div className="loan-card form-card"><h2>Income Verification</h2><div className="loan-form-grid"><Field label="Annual Gross Income" value="$ 120,000" /><Field label="Monthly Net Pay" value="$ 7,500" /><Field label="Employer Name" value="Global Financial Systems Inc." wide /><SelectField label="Industry" value="Financial Services" /><Field label="Years at Current Job" value="5" /></div></div>
				</section>
				<aside className="loan-stack">
					<div className="mini-summary large"><h3>Application Summary</h3><dl><div><dt>Loan Amount</dt><dd>$450,000</dd></div><div><dt>Interest Rate</dt><dd>4.25%</dd></div><div><dt>Term</dt><dd>30 Years</dd></div></dl></div>
					<TrustCard icon={IconInfoCircle} title="Why is this needed?" text="A guarantor's income helps us assess the additional security layer for this loan." />
					<div className="image-tile">Institutional Security</div>
				</aside>
			</div>
		</>
	)
}

function Step12() {
	return (
		<>
			<ProgressHeader title="Document Upload" />
			<div className="document-layout">
				<aside className="loan-stack">
					<div className="loan-card requirements"><h2>Upload Requirements</h2><p><IconCircleCheck /> Files must be in PDF, JPG, or PNG format.</p><p><IconCircleCheck /> Maximum file size per document is 5MB.</p><p><IconCircleCheck /> Ensure text is clear and readable.</p></div>
					<div className="security-card"><IconShieldCheck size={32} /><h2>Banking-Grade Security</h2><p>Your documents are encrypted and stored in secure, ISO-certified servers.</p></div>
				</aside>
				<section className="doc-grid">
					{DOCS.map((doc) => {
						const Icon = doc.icon
						return (
							<article className={`doc-card ${doc.wide ? 'wide' : ''}`} key={doc.title}>
								<div className="card-title-row"><IconTile icon={Icon} /><span className={doc.status.toLowerCase()}>{doc.status}</span></div>
								<h2>{doc.title}</h2>
								<p>{doc.text}</p>
								<button type="button" className="dash-action">{doc.action}</button>
							</article>
						)
					})}
				</section>
			</div>
		</>
	)
}

function Step13() {
	return (
		<>
			<ProgressHeader title="Eligibility & Review" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="approval-card"><h3><IconCircleCheck /> Preliminary Approval Status</h3><div><span><small>Eligible Loan Amount</small><strong>$425,000.00</strong><em>Based on provided financial records.</em></span><span><small>Approval Probability</small><strong>94%</strong><b>High</b></span></div></div>
					<div className="review-grid"><div className="loan-card review-card"><h2><IconFileText /> Loan Summary <button>Edit</button></h2><dl><div><dt>Product Type</dt><dd>Fixed Rate Mortgage</dd></div><div><dt>Interest Rate</dt><dd>4.25% (APR)</dd></div><div><dt>Term</dt><dd>360 Months (30y)</dd></div><div><dt>Estimated Monthly</dt><dd>$2,089.44</dd></div></dl></div><div className="loan-card review-card"><h2><IconUser /> Applicant Summary <button>Edit</button></h2><b>Alexander J. Sterling</b><small>Primary Borrower</small><dl><div><dt>Credit Score</dt><dd className="green">782 Excellent</dd></div><div><dt>DTI Ratio</dt><dd>28.4%</dd></div><div><dt>Annual Income</dt><dd>$145,000</dd></div></dl></div></div>
				</section>
				<aside className="loan-stack"><div className="loan-card checklist"><h2>Document Checklist</h2><p><IconCircleCheck /> Income Verification <small>Verified on Oct 24</small></p><p><IconCircleCheck /> Asset Statements <small>Verified on Oct 24</small></p><p className="processing"><IconInfoCircle /> Insurance Quote <small>Processing Final Review...</small></p><button type="button">+ Add Document</button></div><div className="tips-card muted"><h3>Next Steps Tip</h3><p>Your debt-to-income ratio is well within the prime category.</p></div></aside>
			</div>
		</>
	)
}

function Step14() {
	return (
		<>
			<ProgressHeader title="Legal Compliance" />
			<div className="loan-two-column">
				<section className="loan-stack">
					<div className="loan-card legal-card"><h2><IconSignature /> Master Loan Agreement <small>v2.4 Last updated Oct 2023</small></h2><h3>1. Introduction and Definitions</h3><p>This Master Loan Agreement governs the terms of your credit facility. By signing below, you acknowledge that you have read and agreed to the terms herein.</p><h3>2. Disbursement of Funds</h3><p>Upon final approval and verification of all documents, funds will be disbursed to the verified bank account provided during the application process.</p><h3>3. Interest and Repayment</h3></div>
					<div className="loan-card consent-card"><label><input type="checkbox" /><span><b>I accept the Master Loan Agreement</b>I have read and agree to all terms and conditions.</span></label><label><input type="checkbox" /><span><b>Electronic Signature Consent</b>I consent to use electronic signatures and receive documents digitally.</span></label></div>
				</section>
				<aside className="loan-stack"><div className="summary-card small"><h2><IconFileText /> Final Summary</h2><dl><div><dt>Loan Amount</dt><dd>$45,000.00</dd></div><div><dt>Term</dt><dd>60 Months</dd></div><div><dt>APR</dt><dd>4.25%</dd></div></dl></div><div className="loan-card signature-card"><h2>Digital Signature</h2><p>Please draw your signature below or type your full legal name.</p><div className="segmented"><button type="button" className="active">Draw</button><button type="button">Type</button></div><div>Sign here</div><button type="button"><IconRefresh size={18} /> Clear signature</button></div></aside>
			</div>
		</>
	)
}

function Step15() {
	return (
		<>
			<ProgressHeader title="Final Review & Submission" />
			<div className="final-layout">
				<section className="loan-card final-card">
					<div className="card-title-row"><span><small>Application Reference</small><strong>#LOMS-2024-0892-XF</strong></span><span className="pending-pill">Pending Final Action</span></div>
					<div className="final-grid"><span><small>Applicant Name</small><b>Alexander J. Sterling</b></span><span><small>Loan Type</small><b>Commercial Real Estate</b></span><span><small>Requested Amount</small><strong>$450,000.00</strong></span><span><small>Estimated Term</small><b>180 Months (15 Years)</b></span></div>
					<h2><IconFileText /> Documents Summary</h2>
					<div className="document-list"><span>Identity Verification.pdf</span><span>Tax Returns 2023.zip</span><span>Property Appraisal.pdf</span><span>Credit Authorization.signed</span></div>
				</section>
				<aside className="loan-stack"><div className="placeholder-img">img</div><div className="loan-card declaration"><h3>Final Declaration</h3><label><input type="checkbox" /><span>I hereby certify that all information provided is true, complete, and accurate.</span></label></div><TrustCard icon={IconHeadset} title="Need help?" text="0800-LOMS-SUPPORT" /></aside>
				<div className="info-alert final-note"><IconInfoCircle /> Once submitted, you will no longer be able to edit this application. You can track progress via your dashboard.</div>
			</div>
		</>
	)
}

function SuccessCard() {
	return (
		<section className="success-layout">
			<div className="success-visual"><div className="vault-art"><IconFileCheck size={134} /></div><span>Security Check</span><span>Encryption <IconLock size={22} /></span></div>
			<div className="success-copy">
				<span className="success-badge"><IconCircleCheck size={18} /> Submission Received</span>
				<h1>Application Submitted Successfully</h1>
				<p>Thank you for choosing us. Your personal loan application is now being processed by our underwriting team. We have sent a confirmation email to your registered address.</p>
				<div className="success-stats"><span><small>Application ID</small><b>#LN-8842-X90</b></span><span><small>Submission Date</small><b>Oct 24, 2023</b></span><span className="wide"><small>Current Status</small><b>Pending Review</b><em>Est. decision 24 - 48 Hours</em></span></div>
				<div className="success-actions"><button type="button">Track Application</button><button type="button" onClick={() => navigate('#/dashboard')}>Go To Dashboard</button></div>
			</div>
		</section>
	)
}

export default function ApplyLoan() {
	const [activeStep, setActiveStep] = useState(0)
	const [selectedLoan, setSelectedLoan] = useState('Business Loan')
	const [amount, setAmount] = useState(2500000)
	const profile = useMemo(() => readCachedProfile(), [])
	const isSuccess = activeStep === TOTAL_CARDS - 1

	const cards = [
		<Step1 selectedLoan={selectedLoan} setSelectedLoan={setSelectedLoan} />,
		<Step2 amount={amount} setAmount={setAmount} />,
		<Step3 profile={profile} selectedLoan={selectedLoan} amount={amount} />,
		<Step4 />,
		<Step5 />,
		<Step6 />,
		<Step7 />,
		<Step8 />,
		<Step9 />,
		<Step10 />,
		<Step11 />,
		<Step12 />,
		<Step13 />,
		<Step14 />,
		<Step15 />,
		<SuccessCard />,
	]

	const previous = () => setActiveStep((step) => Math.max(0, step - 1))
	const next = () => setActiveStep((step) => Math.min(TOTAL_CARDS - 1, step + 1))

	return (
		<main className="loan-apply-page">
			<img className="loan-apply-bg" src={heroBg} alt="" aria-hidden="true" />
			<AppNavbar activePage="apply-loan" />
			<div className="loan-apply-shell">
				<section className="loan-apply-panel">
				<StepBreadcrumb />                              {/* ← moved outside, above card */}
				<div className={`loan-step-card ${isSuccess ? 'is-success' : ''}`}>
    				<div className="loan-step-body">{cards[activeStep]}</div>
				</div>
				</section>
			</div>
			<footer className="loan-flow-footer">
				<div>
					<small>{isSuccess ? 'Submitted' : `Step ${Math.min(activeStep + 1, TOTAL_STEPS)}/${TOTAL_STEPS}`}</small>
					<strong>{STEP_TITLES[activeStep]}</strong>
				</div>
				<div>
					<button type="button" className="footer-secondary" disabled={activeStep === 0} onClick={previous}><IconArrowLeft size={22} /> Previous</button>
					<button type="button" className="footer-primary" disabled={isSuccess} onClick={next}>{activeStep === TOTAL_STEPS - 1 ? 'Submit Application' : 'Next'} <IconArrowRight size={22} /></button>
				</div>
			</footer>
		</main>
	)
}