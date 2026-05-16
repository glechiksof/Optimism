import { useState } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'
import FormError from './ui/FormError'
import { joinTeam } from '../api/teams'
import { getErrorMessage } from '../utils/errors'

interface JoinButtonProps {
  teamId: string
  joinMethod: string
  isFull: boolean
  isMember: boolean
  onJoinSuccess: () => void
}

export default function JoinButton({ teamId, joinMethod, isFull, isMember, onJoinSuccess }: JoinButtonProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isMember) {
    return <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>✓ You are a member</span>
  }

  if (joinMethod === 'manual') {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Invitation only</span>
  }

  if (isFull) {
    return (
      <button disabled style={{ padding: '0.6rem 1.25rem', background: 'var(--color-border)', color: 'var(--color-text-muted)', border: 'none', borderRadius: 'var(--border-radius)', fontWeight: 600, cursor: 'not-allowed', fontSize: '0.875rem' }}>
        Team is full
      </button>
    )
  }

  async function handleJoin(tokenVal?: string) {
    setError('')
    setLoading(true)
    try {
      await joinTeam(teamId, tokenVal)
      onJoinSuccess()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to join team'))
    } finally {
      setLoading(false)
    }
  }

  if (joinMethod === 'link') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Input
          label="Join Token"
          placeholder="Paste invite token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={loading}
        />
        <Button loading={loading} onClick={() => handleJoin(token)} disabled={!token.trim()}>
          JOIN WITH TOKEN
        </Button>
        <FormError message={error} />
      </div>
    )
  }

  if (joinMethod === 'mixed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Button loading={loading} onClick={() => handleJoin(undefined)}>
          JOIN TEAM
        </Button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Or join with token"
              placeholder="Paste invite token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button variant="secondary" loading={loading} onClick={() => handleJoin(token)} disabled={!token.trim()} style={{ width: 'auto', padding: '0.85rem 1rem', flexShrink: 0 }}>
            JOIN
          </Button>
        </div>
        <FormError message={error} />
      </div>
    )
  }

  // team_page
  return (
    <div>
      <Button loading={loading} onClick={() => handleJoin(undefined)}>
        JOIN TEAM
      </Button>
      <FormError message={error} />
    </div>
  )
}
