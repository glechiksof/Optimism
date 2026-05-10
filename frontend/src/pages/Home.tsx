import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div style={styles.wrap}>
      <div style={styles.hero}>
        <img src="/Illustration.png" alt="" style={styles.illustration} />
        <h1 style={styles.title}>Create, Join and Play</h1>
        <p style={styles.subtitle}>
          Find a team to play in your city and create tournament brackets conveniently
        </p>
        <div style={styles.actions}>
          <Link to="/tournaments" style={styles.btnPrimary}>Browse Tournaments</Link>
          <Link to="/create-tournament" style={styles.btnSecondary}>Create Tournament</Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - var(--navbar-height))',
    padding: '2rem',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '560px',
  },
  illustration: {
    width: '220px',
    height: 'auto',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    background: 'var(--color-primary)',
    color: '#fff',
    padding: '0.75rem 1.75rem',
    borderRadius: 'var(--border-radius)',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '1rem',
  },
  btnSecondary: {
    background: 'transparent',
    color: 'var(--color-primary)',
    padding: '0.75rem 1.75rem',
    borderRadius: 'var(--border-radius)',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '1rem',
    border: '2px solid var(--color-primary)',
  },
}
