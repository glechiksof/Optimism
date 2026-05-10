import { useParams } from 'react-router-dom'

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Tournament Detail</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Tournament ID: {id} — detail view coming in Day 5 (T13).</p>
    </div>
  )
}
