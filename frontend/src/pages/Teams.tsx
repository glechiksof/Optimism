import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTeams, type Team } from '../api/teams'
import TeamCard from '../components/TeamCard'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

export default function Teams() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listTeams({ visible_only: true })
      .then((res) => setTeams(res.items))
      .catch(() => setError('Failed to load teams'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Teams</h1>
          {user && (
            <Button onClick={() => navigate('/teams/create')}>Create Team</Button>
          )}
        </div>

        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
        {!loading && !error && teams.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No teams yet.</p>
            {user ? (
              <button
                onClick={() => navigate('/teams/create')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Create the first team →
              </button>
            ) : (
              <p style={{ fontSize: '0.875rem' }}>Log in to create one.</p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
