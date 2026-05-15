import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJoinedTournaments } from '../api/participation'
import type { Tournament } from '../api/tournaments'
import TournamentCard from '../components/TournamentCard'

const ONGOING_STATUSES = new Set(['open', 'closed', 'started'])

export default function OngoingTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const all = await getJoinedTournaments()
        const ongoing = all.filter((t) => ONGOING_STATUSES.has(t.status))
        if (!cancelled) setTournaments(ongoing)
      } catch {
        if (!cancelled) setTournaments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ongoing Tournaments</h1>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        ) : tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            <p>You are not registered in any active tournaments.</p>
            <Link to="/tournaments" style={{ color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.75rem', display: 'inline-block' }}>
              Browse tournaments →
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
