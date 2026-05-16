import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import TournamentCard from '../components/TournamentCard'
import { listTournaments, getHostedTournaments, type Tournament } from '../api/tournaments'
import { getJoinedTournaments } from '../api/participation'
import { useAuthStore } from '../store/authStore'

type Tab = 'search' | 'hosted' | 'joined'

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const tabParam = searchParams.get('tab') as Tab | null
  const initialTab: Tab = tabParam === 'hosted' || tabParam === 'joined' ? tabParam : 'search'
  const [tab, setTab] = useState<Tab>(initialTab)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'solo' | 'team'>('all')
  const [results, setResults] = useState<Tournament[]>([])
  const [total, setTotal] = useState(0)
  const [loadingSearch, setLoadingSearch] = useState(false)

  const [hosted, setHosted] = useState<Tournament[]>([])
  const [loadingHosted, setLoadingHosted] = useState(false)

  const [joined, setJoined] = useState<Tournament[]>([])
  const [loadingJoined, setLoadingJoined] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function switchTab(t: Tab) {
    setTab(t)
    setSearchParams(t === 'search' ? {} : { tab: t })
  }

  useEffect(() => {
    if (tab !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await listTournaments({
          search: query || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
        })
        setResults(res.items)
        setTotal(res.total)
      } catch {
        setResults([])
        setTotal(0)
      } finally {
        setLoadingSearch(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, tab, typeFilter])

  useEffect(() => {
    if (tab !== 'hosted') return
    if (!user) return
    setLoadingHosted(true)
    getHostedTournaments()
      .then(setHosted)
      .catch(() => setHosted([]))
      .finally(() => setLoadingHosted(false))
  }, [tab, user])

  useEffect(() => {
    if (tab !== 'joined') return
    if (!user) return
    setLoadingJoined(true)
    getJoinedTournaments()
      .then(setJoined)
      .catch(() => setJoined([]))
      .finally(() => setLoadingJoined(false))
  }, [tab, user])

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.625rem 1.25rem',
    fontWeight: active ? 700 : 400,
    fontSize: '0.9rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'color var(--transition)',
  })

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Tournaments</h1>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <button style={tabStyle(tab === 'search')} onClick={() => switchTab('search')}>
            Search
          </button>
          {user && (
            <>
              <button style={tabStyle(tab === 'hosted')} onClick={() => switchTab('hosted')}>
                Hosting
              </button>
              <button style={tabStyle(tab === 'joined')} onClick={() => switchTab('joined')}>
                Joined
              </button>
            </>
          )}
        </div>

        {tab === 'search' && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search tournaments..."
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'solo' | 'team')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '0.9rem',
                  background: 'var(--color-bg)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All formats</option>
                <option value="solo">Solo</option>
                <option value="team">Team</option>
              </select>
            </div>

            {loadingSearch ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '1rem' }}>No tournaments found</p>
                {user && (
                  <button
                    onClick={() => navigate('/create-tournament')}
                    style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    Create one →
                  </button>
                )}
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  {total} tournament{total !== 1 ? 's' : ''} found
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem',
                }}>
                  {results.map((t) => <TournamentCard key={t.id} tournament={t} />)}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'hosted' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <button
                onClick={() => navigate('/create-tournament')}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  padding: '0.5rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                + New Tournament
              </button>
            </div>

            {loadingHosted ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            ) : hosted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                <p>No tournaments yet</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {hosted.map((t) => <TournamentCard key={t.id} tournament={t} />)}
              </div>
            )}
          </>
        )}

        {tab === 'joined' && (
          <>
            {loadingJoined ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            ) : joined.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                <p>You haven&apos;t joined any tournaments yet.</p>
                <button
                  onClick={() => switchTab('search')}
                  style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  Browse tournaments →
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {joined.map((t) => <TournamentCard key={t.id} tournament={t} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
