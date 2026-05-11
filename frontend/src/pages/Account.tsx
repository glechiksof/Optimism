import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Account() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Account</h1>

      {user && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Logged in as
          </p>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{user.username}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Link to="/profile" style={styles.card}>
          <div style={styles.cardIcon}>👤</div>
          <h3 style={styles.cardTitle}>Profile</h3>
          <p style={styles.cardDesc}>View and edit your profile information</p>
        </Link>

        <Link to="/statistics" style={styles.card}>
          <div style={styles.cardIcon}>📊</div>
          <h3 style={styles.cardTitle}>Statistics</h3>
          <p style={styles.cardDesc}>View your tournament and team stats</p>
        </Link>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'block',
    padding: '1.5rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius)',
    textDecoration: 'none',
    color: 'var(--color-text)',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  cardIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    margin: 0,
  },
  cardDesc: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
}
