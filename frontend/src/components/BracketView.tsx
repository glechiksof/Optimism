import type { Match } from '../api/matches'
import MatchCard from './MatchCard'

interface Props {
  matches: Match[]
  tournamentId: string
  canPickWinner?: boolean
  onResult?: () => void
}

export default function BracketView({ matches, tournamentId, canPickWinner = false, onResult }: Props) {
  if (matches.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No matches yet. Organizer can generate the bracket once registration closes.
      </p>
    )
  }

  const rounds = new Map<number, Match[]>()
  for (const m of matches) {
    if (!rounds.has(m.round_number)) rounds.set(m.round_number, [])
    rounds.get(m.round_number)!.push(m)
  }
  const sortedRoundNums = [...rounds.keys()].sort((a, b) => a - b)

  return (
    <div style={{
      display: 'flex',
      gap: '1.5rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
    }}>
      {sortedRoundNums.map((rn) => (
        <div key={rn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 240 }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}>
            Round {rn}
          </h3>
          {rounds.get(rn)!.sort((a, b) => a.match_number - b.match_number).map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              tournamentId={tournamentId}
              canPickWinner={canPickWinner}
              onResult={onResult}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
