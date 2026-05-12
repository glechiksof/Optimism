import { useNavigate } from 'react-router-dom'
import type { Tournament } from '../api/tournaments'

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--color-text-muted)',
  open: 'var(--color-success)',
  closed: 'var(--color-warning)',
  started: 'var(--color-primary)',
  finished: 'var(--color-text-muted)',
}

const BRACKET_LABELS: Record<string, string> = {
  single_elim: 'Single Elim',
  round_robin: 'Round Robin',
}

interface TournamentCardProps {
  tournament: Tournament
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{tournament.name}</h3>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: STATUS_COLORS[tournament.status] ?? 'var(--color-text-muted)',
            flexShrink: 0,
            marginLeft: '0.5rem',
          }}
        >
          {tournament.status}
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
        {tournament.sport_type}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.75rem',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          padding: '0.2rem 0.6rem',
          borderRadius: 'var(--border-radius-pill)',
          fontWeight: 500,
        }}>
          {BRACKET_LABELS[tournament.bracket_type] ?? tournament.bracket_type}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
        <span>{tournament.current_participants}/{tournament.max_participants} participants</span>
      </div>
    </div>
  )
}
