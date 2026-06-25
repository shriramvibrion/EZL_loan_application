import './home.css'
import heroBg from '../../image/img.jpg'

export default function Home() {
  return (
    <main className="home-page">
      <div className="home-overlay" />

      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          <div>
            <strong>EZL Loan</strong>
            <span>Loan Management System</span>
          </div>
        </div>

        <nav className="topnav" aria-label="Primary">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">Trusted and Secured Digital Platform</p>
        <h2>
Get the Funds You Need,
When You Need Them</h2>
        <p className="subtitle">
          Secure, fast, and smart digital loan processing platform for applicants and internal operations teams.
        </p>

        <div className="cta-row" role="group" aria-label="Login options">
          <button
            className="cta user-cta"
            type="button"
            onClick={() => (window.location.hash = '#/user-login')}
          >
            User Login
          </button>
          <button
            className="cta verifier-cta"
            type="button"
            onClick={() => (window.location.hash = '#/verifier-login')}
          >
            Verifier Login
          </button>
          <button
            className="cta disburser-cta"
            type="button"
            onClick={() => (window.location.hash = '#/disburser-login')}
          >
            Disbursement Officer
          </button>
          <button
            className="cta admin-cta"
            type="button"
            onClick={() => (window.location.hash = '#/admin-login')}
          >
            Admin Login
          </button>
        </div>
      </section>

      <footer className="footer-note" id="contact">
        <span>Professional lending experience built for trust, speed, and clarity.</span>
      </footer>

      <img className="bg-image" src={heroBg} alt="Loan management background" />
    </main>
  )
}