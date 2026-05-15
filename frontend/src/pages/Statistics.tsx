import { useEffect, useState } from 'react'
import { getMyStats, type UserStats } from '../api/users'

export default function Statistics() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getMyStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => { if (!cancelled) setError('Failed to load stats') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Statistics</h1>
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error || !stats ? (
        <p style={{ color: 'var(--color-error)' }}>{error || 'No stats available'}</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}>
          <StatCard label="Tournaments Organized" value={stats.tournaments_organized} />
          <StatCard label="Tournaments Joined" value={stats.tournaments_joined} />
          <StatCard label="Tournaments Won" value={stats.tournaments_won} />
          <StatCard label="Matches Played" value={stats.matches_played} />
          <StatCard label="Matches Won" value={stats.matches_won} />
          <StatCard
            label="Win Rate"
            value={stats.matches_played > 0
              ? `${Math.round((stats.matches_won / stats.matches_played) * 100)}%`
              : '—'}
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '1.25rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
        {value}
      </div>
    </div>
  )
}
