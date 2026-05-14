import type { Match, MatchParticipantInfo } from '../api/matches'

interface Props {
  match: Match
}

function participantLabel(p: MatchParticipantInfo | null): string {
  if (!p) return 'TBD'
  return p.username ?? p.manual_name ?? (p.user_id ? `User #${p.user_id.slice(0, 8)}` : 'Unknown')
}

export default function MatchCard({ match }: Props) {
  const isCompleted = match.status === 'completed'
  const winnerA = isCompleted && match.winner_id && match.participant_a?.id === match.winner_id
  const winnerB = isCompleted && match.winner_id && match.participant_b?.id === match.winner_id

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

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '0.75rem',
      minWidth: 200,
    }}>
      <div style={{
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Match {match.match_number}
        {isCompleted && <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>● completed</span>}
      </div>
      <div style={rowStyle(!!winnerA)}>
        <span>{participantLabel(match.participant_a)}</span>
        {winnerA && <span>✓</span>}
      </div>
      <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
      <div style={rowStyle(!!winnerB)}>
        <span>{participantLabel(match.participant_b)}</span>
        {winnerB && <span>✓</span>}
      </div>
    </div>
  )
}
