import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  getTournament,
  publishTournament, closeTournament, startTournament,
  type Tournament,
} from '../api/tournaments'
import {
  listParticipants, getParticipationStatus,
  leaveTournament, removeParticipant,
  type Participant, type ParticipationStatus,
} from '../api/participation'
import { listMatches, generateMatches, getStandings, type Match, type StandingsRow } from '../api/matches'
import { useAuthStore } from '../store/authStore'
import JoinTournamentButton from '../components/JoinTournamentButton'
import TournamentTeamPicker from '../components/TournamentTeamPicker'
import BracketView from '../components/BracketView'
import Toast from '../components/ui/Toast'
import { getErrorMessage } from '../utils/errors'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open for registration',
  closed: 'Registration closed',
  started: 'In progress',
  finished: 'Finished',
}

const STATUS_PILL_COLORS: Record<string, { bg: string; fg: string }> = {
  draft:    { bg: '#e5e7eb', fg: '#6b7280' },  // grey
  open:     { bg: '#dcfce7', fg: '#15803d' },  // green
  closed:   { bg: '#fef3c7', fg: '#92400e' },  // amber
  started:  { bg: '#dbeafe', fg: '#1d4ed8' },  // blue
  finished: { bg: '#f3e8ff', fg: '#6b21a8' },  // purple
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<StandingsRow[]>([])
  const [status, setStatus] = useState<ParticipationStatus>({ is_participant: false, participant_id: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [actionError, setActionError] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

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
      if (t.bracket_type === 'round_robin') {
        try {
          const s = await getStandings(id)
          setStandings(s.items)
        } catch { setStandings([]) }
      } else {
        setStandings([])
      }
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

  // load is locally scoped + only reads id+user.id — disabling exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [id, user?.id])

  async function handleGenerate() {
    if (!id) return
    setGenerating(true)
    setActionError('')
    try {
      await generateMatches(id)
      await load()
      setToast({ message: 'Bracket generated', variant: 'success' })
    } catch (e: unknown) {
      setActionError(getErrorMessage(e, 'Failed to generate matches'))
    } finally {
      setGenerating(false)
    }
  }

  async function runTransition(action: 'publish' | 'close' | 'start') {
    if (!id) return
    setTransitioning(true)
    setActionError('')
    try {
      const fn = action === 'publish' ? publishTournament : action === 'close' ? closeTournament : startTournament
      await fn(id)
      await load()
      const labels = { publish: 'Tournament published', close: 'Registration closed', start: 'Tournament started' }
      setToast({ message: labels[action], variant: 'success' })
    } catch (e: unknown) {
      setActionError(getErrorMessage(e, `Failed to ${action} tournament`))
    } finally {
      setTransitioning(false)
    }
  }

  async function handleLeave() {
    if (!id || !tournament) return
    if (!confirm(`Cancel your registration in ${tournament.name}?`)) return
    setActionError('')
    try {
      await leaveTournament(id)
      await load()
      setToast({ message: 'You left the tournament', variant: 'success' })
    } catch (e: unknown) {
      setActionError(getErrorMessage(e, 'Failed to leave tournament'))
    }
  }

  async function handleKick(p: Participant) {
    if (!id || !tournament) return
    const label = p.manual_name ?? (p.user_id ? `User #${p.user_id.slice(0, 8)}` : 'this participant')
    if (!confirm(`Remove ${label} from ${tournament.name}?`)) return
    setActionError('')
    try {
      await removeParticipant(id, p.id)
      await load()
      setToast({ message: 'Participant removed', variant: 'success' })
    } catch (e: unknown) {
      setActionError(getErrorMessage(e, 'Failed to remove participant'))
    }
  }

  if (loading) {
    return <div className="page"><div className="container"><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div></div>
  }
  if (error || !tournament) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error || 'Tournament not found'}</p>
          <Link to="/tournaments" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Back to tournaments</Link>
        </div>
      </div>
    )
  }

  const isOrganizer = !!user && user.id === tournament.organizer_id
  const isFull = tournament.current_participants >= tournament.max_participants
  const canGenerate = isOrganizer && matches.length === 0 && participants.length >= 2 && tournament.status === 'closed'
  const canLeave = !isOrganizer && status.is_participant && ['open', 'closed'].includes(tournament.status)
  const canKick = isOrganizer && ['open', 'closed'].includes(tournament.status)

  return (
    <div className="page">
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      <div className="container" style={{ maxWidth: 920 }}>
        {/* Privacy banner */}
        {!tournament.is_visible && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24', color: '#78350f',
            borderRadius: 'var(--border-radius)', padding: '0.75rem 1rem',
            marginBottom: '1rem', fontSize: '0.875rem',
          }}>
            🔒 This tournament is private. Only invited participants should have this link.
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{tournament.name}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={pillStyle('primary')}>{tournament.sport_type}</span>
              <span style={pillStyle('muted')}>{tournament.bracket_type === 'single_elim' ? 'Single elimination' : 'Round robin'}</span>
              <span style={statusPillStyle(tournament.status)}>
                {STATUS_LABELS[tournament.status] ?? tournament.status}
              </span>
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

        {actionError && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{actionError}</p>
        )}

        {/* Organizer controls */}
        {isOrganizer && tournament.status !== 'finished' && (
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Tournament Controls</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tournament.status === 'draft' && (
                <TransitionButton label="Publish" onClick={() => runTransition('publish')} disabled={transitioning} />
              )}
              {tournament.status === 'open' && (
                <TransitionButton label="Close Registration" onClick={() => runTransition('close')} disabled={transitioning} />
              )}
              {tournament.status === 'closed' && matches.length > 0 && (
                <TransitionButton label="Start Tournament" onClick={() => runTransition('start')} disabled={transitioning} primary />
              )}
              {canGenerate && (
                <TransitionButton label={generating ? 'Generating...' : 'Generate Bracket'} onClick={handleGenerate} disabled={generating} primary />
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
              {tournament.status === 'draft' && 'Publish to open registration.'}
              {tournament.status === 'open' && 'Close registration when you have enough participants.'}
              {tournament.status === 'closed' && matches.length === 0 && 'Generate the bracket before starting.'}
              {tournament.status === 'closed' && matches.length > 0 && 'Bracket ready. Start the tournament to lock the roster.'}
              {tournament.status === 'started' && 'Tournament in progress. Submit match results via the bracket.'}
            </p>
          </div>
        )}

        {/* Organizer team picker (team-based tournaments only) */}
        {isOrganizer && tournament.is_team_based && tournament.status !== 'finished' && (
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Add Teams</h2>
            <TournamentTeamPicker
              tournamentId={tournament.id}
              registeredTeamIds={new Set(participants.map((p) => p.team_id).filter((x): x is string => !!x))}
              isFull={isFull}
              status={tournament.status}
              onAdded={load}
            />
          </div>
        )}

        {/* Solo join section (hidden on team-based tournaments) */}
        {user && !isOrganizer && !tournament.is_team_based && (
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Registration</h2>
            <JoinTournamentButton
              tournamentId={tournament.id}
              isParticipant={status.is_participant}
              isFull={isFull}
              status={tournament.status}
              onJoinSuccess={load}
            />
            {canLeave && (
              <button
                onClick={handleLeave}
                style={{
                  marginTop: '0.75rem', background: 'transparent',
                  color: 'var(--color-error)', border: '1px solid var(--color-error)',
                  borderRadius: 'var(--border-radius)', padding: '0.4rem 0.85rem',
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                Leave Tournament
              </button>
            )}
          </div>
        )}

        {/* Bracket */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Bracket</h2>
          <BracketView
            matches={matches}
            tournamentId={tournament.id}
            canPickWinner={isOrganizer && tournament.status === 'started'}
            onResult={load}
          />
        </div>

        {/* Standings (round-robin only) */}
        {tournament.bracket_type === 'round_robin' && (
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Standings</h2>
            {standings.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No completed matches yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.5rem 0' }}>#</th>
                    <th>Player</th>
                    <th>W</th>
                    <th>L</th>
                    <th>P</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((r, i) => (
                    <tr key={r.participant_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                      <td>{r.username ?? r.manual_name ?? 'Unknown'}</td>
                      <td>{r.wins}</td>
                      <td>{r.losses}</td>
                      <td>{r.played}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Participants */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Participants ({participants.length})</h2>
          {participants.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No participants yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {participants.map((p) => (
                <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span>{p.team_name ?? p.username ?? p.manual_name ?? (p.user_id ? `User #${p.user_id.slice(0, 8)}` : 'Unknown')}</span>
                  {p.team_id && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>(team)</span>}
                  {canKick && (
                    <button
                      onClick={() => handleKick(p)}
                      style={{
                        marginLeft: 'auto', background: 'transparent', color: 'var(--color-error)',
                        border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.85rem',
                      }}
                      title="Remove participant"
                    >
                      ✕
                    </button>
                  )}
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

function statusPillStyle(status: string): React.CSSProperties {
  const c = STATUS_PILL_COLORS[status] ?? { bg: 'var(--color-border)', fg: 'var(--color-text-muted)' }
  return {
    fontSize: '0.75rem',
    background: c.bg,
    color: c.fg,
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--border-radius-pill)',
    fontWeight: 600,
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

function TransitionButton({ label, onClick, disabled, primary }: { label: string; onClick: () => void; disabled: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: primary ? 'var(--color-primary)' : 'transparent',
        color: primary ? '#fff' : 'var(--color-primary)',
        border: primary ? 'none' : '1px solid var(--color-primary)',
        borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem',
        fontWeight: 600, fontSize: '0.85rem',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  )
}
