import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      )
    })
  }, [users, query])

  const fetchUsers = async () => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'x-admin-email': ADMIN_EMAIL,
          'x-admin-password': ADMIN_PASSWORD,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load users')
      }

      setUsers(data.users || [])
      setLastUpdated(new Date().toISOString())
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'Failed to load users')
      setStatus('error')
    }
  }

  useEffect(() => {
    if (isAuthed) {
      fetchUsers()
    }
  }, [isAuthed])

  const handleLogin = (event) => {
    event.preventDefault()
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      setError('Admin credentials are missing in .env')
      return
    }

    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthed(true)
      setError('')
      return
    }

    setError('Invalid admin credentials')
  }

  const handleLogout = () => {
    setIsAuthed(false)
    setEmail('')
    setPassword('')
    setUsers([])
    setStatus('idle')
    setError('')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Petify Admin Console</p>
          <h1>Operations Dashboard</h1>
        </div>
        {isAuthed ? (
          <div className="topbar-actions">
            <button className="ghost" onClick={fetchUsers}>
              Refresh
            </button>
            <button className="danger" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : null}
      </header>

      {!isAuthed ? (
        <section className="login">
          <div className="card">
            <div className="card-header">
              <h2>Admin Login</h2>
              <p>Secure access for Petify administrators.</p>
            </div>
            <form className="form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@petify.gmail.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              {error ? <div className="error">{error}</div> : null}
              <button type="submit" className="primary">
                Sign in
              </button>
            </form>
            <div className="card-foot">
              <span>Default credentials are stored in .env</span>
            </div>
          </div>
        </section>
      ) : (
        <main className="content">
          <section className="summary">
            <div className="summary-card">
              <p>Total Users</p>
              <h3>{users.length}</h3>
              <span>Active accounts</span>
            </div>
            <div className="summary-card">
              <p>Last Updated</p>
              <h3>{lastUpdated ? formatDate(lastUpdated) : '—'}</h3>
              <span>Server sync time</span>
            </div>
          </section>

          <section className="users">
            <div className="users-header">
              <div>
                <h2>Active Users</h2>
                <p>All registered Petify users currently in the system.</p>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
              />
            </div>

            {status === 'loading' ? (
              <div className="empty">Loading users…</div>
            ) : status === 'error' ? (
              <div className="error-block">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty">No users match that search.</div>
            ) : (
              <div className="table">
                <div className="table-row table-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Joined</span>
                  <span>Updated</span>
                </div>
                {filteredUsers.map((user) => (
                  <div className="table-row" key={user._id}>
                    <span>{user.name || '—'}</span>
                    <span>{user.email || '—'}</span>
                    <span>{formatDate(user.createdAt)}</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  )
}

export default App
