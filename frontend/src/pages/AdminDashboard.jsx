import './admin.css'

export default function AdminDashboard() {
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_id')
    window.location.hash = '#/'
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-card">
          <header className="admin-header">
            <h1>Admin Dashboard</h1>
            <p className="muted">Welcome to the operations console</p>
          </header>

          <section style={{marginTop:20}}>
            <p>Basic admin area. Replace with your dashboard widgets.</p>
            <button className="btn neutral" onClick={handleLogout}>Logout</button>
          </section>
        </div>
      </div>
    </main>
  )
}
