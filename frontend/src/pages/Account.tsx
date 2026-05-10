import { Link } from 'react-router-dom'

export default function Account() {
  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Account</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 320 }}>
        <Link to="/profile" style={styles.menuItem}>Profile</Link>
        <Link to="/statistics" style={styles.menuItem}>Statistics</Link>
      </div>
      <p style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Account menu — full implementation in Day 2 (T06).
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  menuItem: {
    display: 'block',
    padding: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--color-text)',
    fontWeight: 500,
    textDecoration: 'none',
  },
}
