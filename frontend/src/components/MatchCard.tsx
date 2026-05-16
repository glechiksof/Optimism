import { useState } from 'react'
import { submitMatchResult, type Match, type MatchParticipantInfo } from '../api/matches'

interface Props {
  match: Match
  tournamentId: string
  canPickWinner: boolean
  onResult?: () => void
}

function participantLabel(p: MatchParticipantInfo | null): string {
  if (!p) return 'TBD'
  return p.username ?? p.manual_name ?? (p.user_id ? `User #${p.user_id.slice(0, 8)}` : 'Unknown')
}

export default function MatchCard({ match, tournamentId, canPickWinner, onResult }: Props) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isCompleted = match.status === 'completed'
  const winnerA = isCompleted && match.winner_id && match.participant_a?.id === match.winner_id
  const winnerB = isCompleted && match.winner_id && match.participant_b?.id === match.winner_id

  const bothFilled = !!match.participant_a && !!match.participant_b
  const showPicker = canPickWinner && !isCompleted && bothFilled

  async function pick(participantId: string) {
    setSubmitting(participantId)
    setError('')
    try {
      await submitMatchResult(tournamentId, match.id, participantId)
      onResult?.()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit result')
    } finally {
      setSubmitting(null)
    }
  }

  const rowStyle = (isWinner: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    background: isWinner ? 'var(--color-primary-light)' : 'transparent',
    borderRadius: 'var(--border-radius)',
    fontWeight: isWinner ? 700 : 500,
    fontSize: '0.875rem',
    color: isWinner ? 'var(--color-primary)' : 'var(--color-text)',
  })

  function pickButton(participantId: string) {
    const isSubmitting = submitting === participantId
    return (
      <button
        onClick={() => pick(participantId)}
        disabled={submitting !== null}
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--border-radius)',
          padding: '0.2rem 0.55rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: submitting !== null ? 'not-allowed' : 'pointer',
          opacity: submitting !== null ? 0.6 : 1,
        }}
        title="Mark as winner"
      >
        {isSubmitting ? '...' : 'Win'}
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '0.75rem',
      minWidth: 220,
    }}>
      <div style={{
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Match {match.match_number}
        {isCompleted && <span style={{ marginLeft: '0.5rem', color: 'var(--color-success, #16a34a)' }}>● completed</span>}
      </div>

      <div style={rowStyle(!!winnerA)}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {participantLabel(match.participant_a)}
        </span>
        {winnerA && <span>✓</span>}
        {showPicker && match.participant_a && pickButton(match.participant_a.id)}
      </div>
      <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
      <div style={rowStyle(!!winnerB)}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {participantLabel(match.participant_b)}
        </span>
        {winnerB && <span>✓</span>}
        {showPicker && match.participant_b && pickButton(match.participant_b.id)}
      </div>

      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.7rem', marginTop: '0.5rem', marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}
