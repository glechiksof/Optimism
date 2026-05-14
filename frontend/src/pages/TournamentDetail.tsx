import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTournament, type Tournament } from '../api/tournaments'
import {
  listParticipants, getParticipationStatus,
  type Participant, type ParticipationStatus,
} from '../api/participation'
import { listMatches, generateMatches, type Match } from '../api/matches'
import { useAuthStore } from '../store/authStore'
import JoinTournamentButton from '../components/JoinTournamentButton'
import BracketView from '../components/BracketView'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open for registration',
  published: 'Open for registration',
  closed: 'Registration closed',
  started: 'In progress',
  finished: 'Finished',
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [status, setStatus] = useState<ParticipationStatus>({ is_participant: false, participant_id: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [t, parts, ms] = await Promise.all([
        getTournament(id),
        listParticipants(id).catch(() => ({ items: [], total: 0 })),
        listMatches(id).catch(() => ({ items: [], total: 0 })),
      ])
      setTournament(t)
      setParticipants(parts.items)
      setMatches(ms.items)
      if (user) {
        try {
          const s = await getParticipationStatus(id)
          setStatus(s)
        } catch {
          setStatus({ is_participant: false, participant_id: null })
        }
      } else {
        setStatus({ is_participant: false, participant_id: null })
      }
    } catch {
      setError('Tournament not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id, user?.id])

  async function handleGenerate() {
    if (!id) return
    setGenerating(true)
    try {
      const res = await generateMatches(id)
      setMatches(res.items)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to generate matches')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="page"><div className="container"><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div></div>
  }
  if (error || !tournament) {
    return <div className="page"><div className="container"><p style={{ color: 'var(--color-error)' }}>{error || 'Tournament not found'}</p></div></div>
  }

  const isOrganizer = !!user && user.id === tournament.organizer_id
  const isFull = tournament.current_participants >= tournament.max_participants
  const canGenerate = isOrganizer && matches.length === 0 && participants.length >= 2

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 920 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{tournament.name}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={pillStyle('primary')}>{tournament.sport_type}</span>
              <span style={pillStyle('muted')}>{tournament.bracket_type === 'single_elim' ? 'Single elimination' : 'Round robin'}</span>
              <span style={pillStyle('muted')}>{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
            </div>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
        </div>

        {tournament.description && (
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>{tournament.description}</p>
        )}

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '1.25rem',
        }}>
          <Stat label="Participants" value={`${tournament.current_participants} / ${tournament.max_participants}`} />
          <Stat label="Starts" value={new Date(tournament.start_date).toLocaleDateString()} />
          <Stat label="Ends" value={new Date(tournament.end_date).toLocaleDateString()} />
          <Stat label="Visibility" value={tournament.is_visible ? 'Public' : 'Private'} />
        </div>

        {/* Join section */}
        {user && !isOrganizer && (
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Registration</h2>
            <JoinTournamentButton
              tournamentId={tournament.id}
              isParticipant={status.is_participant}
              isFull={isFull}
              status={tournament.status}
              onJoinSuccess={load}
            />
          </div>
        )}

        {/* Bracket */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={sectionTitle}>Bracket</h2>
            {canGenerate && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  background: 'var(--color-primary)', color: '#fff', border: 'none',
                  borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem',
                  fontWeight: 600, fontSize: '0.8rem',
                  cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? 'Generating...' : 'Generate Bracket'}
              </button>
            )}
          </div>
          <BracketView matches={matches} />
        </div>

        {/* Participants */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Participants ({participants.length})</h2>
          {participants.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No participants yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {participants.map((p) => (
                <li key={p.id} style={{ fontSize: '0.875rem' }}>
                  {p.manual_name ?? (p.user_id ? `User #${p.user_id.slice(0, 8)}` : 'Unknown')}
                  {p.team_id && <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>(team)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.25rem',
  marginBottom: '1.25rem',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  margin: 0,
  marginBottom: '0.75rem',
}

function pillStyle(variant: 'primary' | 'muted'): React.CSSProperties {
  return {
    fontSize: '0.75rem',
    background: variant === 'primary' ? 'var(--color-primary-light)' : 'var(--color-border)',
    color: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-text-muted)',
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--border-radius-pill)',
    fontWeight: 500,
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>{value}</div>
    </div>
  )
}
