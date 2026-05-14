import { useEffect, useState } from 'react'
import { listTournaments, type Tournament } from '../api/tournaments'
import { getParticipationStatus } from '../api/participation'
import TournamentCard from '../components/TournamentCard'

const ONGOING_STATUSES = new Set(['open', 'published', 'closed', 'started'])

export default function OngoingTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listTournaments({ page_size: 100 })
        const ongoing = res.items.filter((t) => ONGOING_STATUSES.has(t.status))
        // Filter to ones the current user is registered for.
        const statuses = await Promise.all(
          ongoing.map((t) => getParticipationStatus(t.id).catch(() => ({ is_participant: false, participant_id: null }))),
        )
        const mine = ongoing.filter((_, i) => statuses[i].is_participant)
        if (!cancelled) setTournaments(mine)
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
