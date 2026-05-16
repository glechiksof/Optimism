import { useEffect, useState } from 'react'
import { listTeams, type Team } from '../api/teams'
import { addTeamToTournament } from '../api/participation'
import { getErrorMessage } from '../utils/errors'

interface Props {
  tournamentId: string
  registeredTeamIds: Set<string>
  isFull: boolean
  status: string
  onAdded: () => void
}

const MIN_MEMBERS = 2

export default function TournamentTeamPicker({ tournamentId, registeredTeamIds, isFull, status, onAdded }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listTeams({ visible_only: true })
      .then((res) => { if (!cancelled) setTeams(res.items) })
      .catch(() => { if (!cancelled) setError('Failed to load teams') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const eligible = teams.filter(
    (t) => t.current_size >= MIN_MEMBERS && !registeredTeamIds.has(t.id),
  )

  async function handleAdd() {
    if (!selected) return
    setAdding(true)
    setError('')
    try {
      await addTeamToTournament(tournamentId, selected)
      setSelected('')
      onAdded()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to add team'))
    } finally {
      setAdding(false)
    }
  }

  if (status !== 'open') {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Teams can only be added while the tournament is open for registration.
      </p>
    )
  }

  if (isFull) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Tournament is full — no more teams can be added.
      </p>
    )
  }

  return (
    <div>
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Loading teams...</p>
      ) : eligible.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          No eligible public teams. Teams need at least {MIN_MEMBERS} members and must not already be registered.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={adding}
            style={{
              flex: 1, minWidth: 200,
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.9rem',
              background: 'var(--color-bg)',
            }}
          >
            <option value="">Select a team...</option>
            {eligible.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.current_size}/{t.capacity})
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selected || adding}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem',
              fontWeight: 600, fontSize: '0.85rem',
              cursor: (!selected || adding) ? 'not-allowed' : 'pointer',
              opacity: (!selected || adding) ? 0.6 : 1,
            }}
          >
            {adding ? 'Adding...' : '+ Add Team'}
          </button>
        </div>
      )}
      {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  )
}
