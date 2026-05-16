import { useState } from 'react'
import { joinTournament } from '../api/participation'
import { getErrorMessage } from '../utils/errors'

interface Props {
  tournamentId: string
  isParticipant: boolean
  isFull: boolean
  status: string
  onJoinSuccess: () => void
}

export default function JoinTournamentButton({
  tournamentId,
  isParticipant,
  isFull,
  status,
  onJoinSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isParticipant) {
    return <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>✓ You are registered</span>
  }

  if (status !== 'open') {
    return <span style={{ color: 'var(--color-text-muted)' }}>Registration not open</span>
  }

  if (isFull) {
    return (
      <button disabled style={{
        background: 'var(--color-border)', color: 'var(--color-text-muted)',
        border: 'none', borderRadius: 'var(--border-radius)',
        padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.875rem',
        cursor: 'not-allowed',
      }}>
        Tournament is full
      </button>
    )
  }

  async function handleJoin() {
    setLoading(true)
    setError('')
    try {
      await joinTournament(tournamentId)
      onJoinSuccess()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to join'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--border-radius)',
          padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.875rem',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Joining...' : 'Join Tournament'}
      </button>
      {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  )
}
