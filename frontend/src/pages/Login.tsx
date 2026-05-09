import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel--left">
        <img src="/title+logo.png" alt="Tournaments Organizer" style={{ height: 48, marginBottom: '3rem' }} />
        <img src="/bg-left.png" alt="" style={{ width: '70%', maxWidth: 320 }} />
        <h2 style={{ color: '#fff', marginTop: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>
          Create, Join and Play
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem', textAlign: 'center', lineHeight: 1.6 }}>
          Find team to play in your city and create tournament brackets conveniently
        </p>
      </div>
      <div className="auth-layout__panel--right">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
            Welcome Back!
          </h1>
          <form aria-label="login form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="johndoe@email.com"
                style={inputStyle}
                disabled
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                style={inputStyle}
                disabled
              />
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Auth wiring coming in Day 2 (T05)
            </p>
            <button type="submit" style={btnStyle} disabled>
              SIGN IN
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ fontWeight: 700 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0',
  border: 'none',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '1rem',
  outline: 'none',
  background: 'transparent',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--border-radius)',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.05em',
  cursor: 'not-allowed',
  opacity: 0.7,
}
