import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-layout">
      <aside className="home-layout__left" style={styles.leftPanel}>
        <div style={styles.leftStack}>
          <img src="/title+logo.png" alt="Tournament Organizer" style={styles.titleLogo} />
          <img src="/banana.png" alt="" style={styles.banana} />
        </div>
      </aside>

      <section style={styles.rightPanel}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Create, Join and Play</h1>
          <p style={styles.subtitle}>
            Find a team to play in your city and create tournament brackets conveniently
          </p>
          <div style={styles.actions}>
            <Link to="/tournaments" style={styles.btnPrimary}>Browse Tournaments</Link>
            <Link to="/create-tournament" style={styles.btnSecondary}>Create Tournament</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  leftPanel: {
    backgroundColor: '#4287f5',
    backgroundImage: 'url(/bg-left.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  leftStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '420px',
  },
  titleLogo: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
  },
  banana: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
  },
  rightPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    background: 'var(--color-bg)',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '480px',
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
