import { useNavigate } from 'react-router-dom'
import type { Team } from '../api/teams'
import CapacityBar from './CapacityBar'

const JOIN_METHOD_LABELS: Record<string, string> = {
  team_page: 'Open',
  link: 'Invite link',
  manual: 'By invitation',
  mixed: 'Open + link',
}

interface TeamCardProps {
  team: Team
}

export default function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/teams/${team.id}`)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{team.name}</h3>
        {!team.is_visible && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Private
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.75rem',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          padding: '0.2rem 0.6rem',
          borderRadius: 'var(--border-radius-pill)',
          fontWeight: 500,
        }}>
          {JOIN_METHOD_LABELS[team.join_method] ?? team.join_method}
        </span>
      </div>

      <CapacityBar current={team.current_size} max={team.capacity} />
    </div>
  )
}
