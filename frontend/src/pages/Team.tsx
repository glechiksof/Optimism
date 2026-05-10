import { useParams } from 'react-router-dom'

export default function Team() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Team</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Team ID: {id} — team detail coming in Day 4 (T11).</p>
    </div>
  )
}
