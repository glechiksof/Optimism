import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.code}>404</h1>
      <p style={styles.message}>Page not found</p>
      <Link to="/" style={styles.link}>Back to home</Link>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - var(--navbar-height))',
    gap: '1rem',
    textAlign: 'center',
  },
  code: {
    fontSize: '6rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    lineHeight: 1,
  },
  message: {
    fontSize: '1.25rem',
    color: 'var(--color-text-muted)',
  },
  link: {
    marginTop: '0.5rem',
    color: 'var(--color-primary)',
    fontWeight: 600,
    fontSize: '1rem',
  },
}
