import { useEffect, useState } from 'react'
import { generateToken, getTokens, revokeToken, type JoinToken } from '../api/teams'

interface Props {
  teamId: string
}

export default function TeamTokenManager({ teamId }: Props) {
  const [tokens, setTokens] = useState<JoinToken[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const rows = await getTokens(teamId)
      setTokens(rows)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [teamId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateToken(teamId)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to generate token')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      await revokeToken(teamId, tokenId)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to revoke token')
    }
  }

  async function handleCopy(s: string) {
    await navigator.clipboard.writeText(s)
    setCopied(s)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Join Tokens</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--border-radius)', padding: '0.4rem 0.85rem',
            fontWeight: 600, fontSize: '0.8rem',
            cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? 'Generating...' : '+ Generate Token'}
        </button>
      </div>
      {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Loading...</p>
      ) : tokens.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          No tokens yet. Generate one to invite players via a shareable code.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tokens.map((t) => {
            const expired = new Date(t.expires_at) < new Date()
            const used = !!t.used_at
            const status = used ? 'used' : expired ? 'expired' : !t.is_active ? 'revoked' : 'active'
            const statusColor =
              status === 'active' ? 'var(--color-success, #16a34a)' :
              status === 'used' ? 'var(--color-text-muted)' :
              'var(--color-error)'
            return (
              <li key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.8rem',
              }}>
                <code style={{
                  flex: 1, fontFamily: 'monospace', fontSize: '0.75rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.token}
                </code>
                <span style={{ color: statusColor, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {status}
                </span>
                {status === 'active' && (
                  <>
                    <button
                      onClick={() => handleCopy(t.token)}
                      style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      {copied === t.token ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleRevoke(t.id)}
                      style={{ background: 'none', border: '1px solid var(--color-error)', color: 'var(--color-error)', borderRadius: 'var(--border-radius)', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Revoke
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
