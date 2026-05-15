import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getTeam, leaveTeam, removeMember, type Team, type TeamMember } from '../api/teams'
import { useAuthStore } from '../store/authStore'
import CapacityBar from '../components/CapacityBar'
import JoinButton from '../components/JoinButton'
import TeamTokenManager from '../components/TeamTokenManager'

const JOIN_METHOD_LABELS: Record<string, string> = {
  team_page: 'Open',
  link: 'Invite link only',
  manual: 'By invitation',
  mixed: 'Open + invite link',
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  function load() {
    if (!id) return
    setLoading(true)
    getTeam(id)
      .then(setTeam)
      .catch(() => setError('Team not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handleLeave() {
    if (!team) return
    if (!confirm(`Leave ${team.name}?`)) return
    setActionError('')
    try {
      await leaveTeam(team.id)
      load()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Failed to leave team')
    }
  }

  async function handleRemove(memberId: string, label: string) {
    if (!team) return
    if (!confirm(`Remove ${label} from ${team.name}?`)) return
    setActionError('')
    try {
      await removeMember(team.id, memberId)
      load()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Failed to remove member')
    }
  }

  if (loading) {
    return <div className="page"><div className="container"><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div></div>
  }
  if (error || !team) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error || 'Team not found'}</p>
          <Link to="/teams" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Back to teams</Link>
        </div>
      </div>
    )
  }

  const isMember = !!user && team.members.some((m) => m.user_id === user.id)
  const isCreator = !!user && team.created_by === user.id
  const isFull = team.current_size >= team.capacity
  const showTokenMgr = isCreator && (team.join_method === 'link' || team.join_method === 'mixed')

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Privacy banner */}
        {!team.is_visible && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24', color: '#78350f',
            borderRadius: 'var(--border-radius)', padding: '0.75rem 1rem',
            marginBottom: '1rem', fontSize: '0.875rem',
          }}>
            🔒 This team is private. Only invited members should have this link.
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{team.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.75rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                padding: '0.2rem 0.6rem', borderRadius: 'var(--border-radius-pill)', fontWeight: 500,
              }}>
                {JOIN_METHOD_LABELS[team.join_method] ?? team.join_method}
              </span>
              <span style={{
                fontSize: '0.75rem', background: 'var(--color-border)', color: 'var(--color-text-muted)',
                padding: '0.2rem 0.6rem', borderRadius: 'var(--border-radius-pill)',
              }}>
                {team.is_visible ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            ← Back
          </button>
        </div>

        {/* Capacity */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <CapacityBar current={team.current_size} max={team.capacity} />
        </div>

        {actionError && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{actionError}</p>
        )}

        {/* Join / Leave section */}
        {user && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Membership</h2>
            <JoinButton
              teamId={team.id}
              joinMethod={team.join_method}
              isFull={isFull}
              isMember={isMember}
              onJoinSuccess={load}
            />
            {isMember && !isCreator && (
              <button
                onClick={handleLeave}
                style={{
                  marginTop: '0.75rem', background: 'transparent',
                  color: 'var(--color-error)', border: '1px solid var(--color-error)',
                  borderRadius: 'var(--border-radius)', padding: '0.4rem 0.85rem',
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                Leave Team
              </button>
            )}
          </div>
        )}

        {/* Token manager (creator only, for link/mixed) */}
        {showTokenMgr && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <TeamTokenManager teamId={team.id} />
          </div>
        )}

        {/* Members list */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Members ({team.members.length})
          </h2>
          {team.members.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No members yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {team.members.map((m: TeamMember) => {
                const label = m.manual_name ?? (m.user_id ? `User #${m.user_id.slice(0, 8)}` : 'Unknown')
                const canKick = isCreator && m.user_id !== user?.id
                return (
                  <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {(m.manual_name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>{label}</span>
                    {m.manual_name && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>manual</span>
                    )}
                    {canKick && (
                      <button
                        onClick={() => handleRemove(m.id, label)}
                        style={{
                          marginLeft: 'auto', background: 'transparent',
                          color: 'var(--color-error)', border: 'none',
                          padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.85rem',
                        }}
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
