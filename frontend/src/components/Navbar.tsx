import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

export default function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}teambracket-icon.png`} alt="Tournament Organizer" style={styles.logo} />
          <span style={styles.brandText}>Tournament Organizer</span>
        </Link>

        <div style={styles.links}>
          <NavLink
            to="/tournaments"
            end
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            Tournaments
          </NavLink>
          <NavLink
            to="/tournaments/ongoing"
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            Ongoing
          </NavLink>
          <NavLink
            to="/teams"
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            Teams
          </NavLink>
          {user && (
            <NavLink
              to="/create-tournament"
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
            >
              Create
            </NavLink>
          )}
        </div>

        <div style={styles.right}>
          {user ? (
            <div style={styles.accountWrap}>
              <button
                style={styles.avatarBtn}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
              >
                <div style={styles.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>
              {menuOpen && (
                <div style={styles.dropdown}>
                  <Link to="/profile" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/statistics" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    Statistics
                  </Link>
                  <button style={{ ...styles.dropdownItem, ...styles.logoutBtn }} onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.link}>Log in</Link>
              <Link to="/signup" style={styles.signupBtn}>Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    height: 'var(--navbar-height)',
    background: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  },
  inner: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logo: {
    height: '32px',
    width: 'auto',
  },
  brandText: {
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--color-primary)',
    whiteSpace: 'nowrap',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flex: 1,
  },
  link: {
    color: 'var(--color-text)',
    fontWeight: 500,
    fontSize: '0.9rem',
    textDecoration: 'none',
    padding: '0.25rem 0',
    borderBottom: '2px solid transparent',
    transition: 'color var(--transition)',
  },
  linkActive: {
    color: 'var(--color-primary)',
    borderBottom: '2px solid var(--color-primary)',
  },
  right: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  authLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  signupBtn: {
    background: 'var(--color-primary)',
    color: '#fff',
    padding: '0.4rem 1rem',
    borderRadius: 'var(--border-radius)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
  accountWrap: {
    position: 'relative',
  },
  avatarBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--color-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '160px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownItem: {
    padding: '0.75rem 1rem',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    textDecoration: 'none',
    display: 'block',
    borderBottom: '1px solid var(--color-border)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    color: 'var(--color-error)',
    cursor: 'pointer',
    borderBottom: 'none',
  },
}
