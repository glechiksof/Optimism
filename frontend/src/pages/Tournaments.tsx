import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import TournamentCard from '../components/TournamentCard'
import { listTournaments, getHostedTournaments, type Tournament } from '../api/tournaments'
import { useAuthStore } from '../store/authStore'

type Tab = 'search' | 'hosted'

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const initialTab = (searchParams.get('tab') as Tab) === 'hosted' ? 'hosted' : 'search'
  const [tab, setTab] = useState<Tab>(initialTab)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Tournament[]>([])
  const [total, setTotal] = useState(0)
  const [loadingSearch, setLoadingSearch] = useState(false)

  const [hosted, setHosted] = useState<Tournament[]>([])
  const [loadingHosted, setLoadingHosted] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function switchTab(t: Tab) {
    setTab(t)
    setSearchParams(t === 'hosted' ? { tab: 'hosted' } : {})
  }

  useEffect(() => {
    if (tab !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await listTournaments({ search: query || undefined })
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
  }, [query, tab])

  useEffect(() => {
    if (tab !== 'hosted') return
    if (!user) return
    setLoadingHosted(true)
    getHostedTournaments()
      .then(setHosted)
      .catch(() => setHosted([]))
      .finally(() => setLoadingHosted(false))
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
            <button style={tabStyle(tab === 'hosted')} onClick={() => switchTab('hosted')}>
              My Tournaments
            </button>
          )}
        </div>

        {tab === 'search' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search tournaments..."
              />
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
      </div>
    </div>
  )
}
