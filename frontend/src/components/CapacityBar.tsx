interface CapacityBarProps {
  current: number
  max: number
}

export default function CapacityBar({ current, max }: CapacityBarProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const color = pct > 80 ? 'var(--color-error)' : pct > 50 ? 'var(--color-warning)' : 'var(--color-success)'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
        <span>Members</span>
        <span style={{ fontWeight: 600, color: pct >= 100 ? 'var(--color-error)' : 'var(--color-text)' }}>
          {current}/{max}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}
