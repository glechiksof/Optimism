import { useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ position: 'relative' }}>
      <svg
        style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
        width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      >
        <circle cx={11} cy={11} r={8} />
        <line x1={21} y1={21} x2={16.65} y2={16.65} />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.625rem 2.25rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          fontSize: '0.9rem',
          outline: 'none',
          background: 'var(--color-bg)',
          transition: 'border-color var(--transition)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-focus)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          style={{
            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            padding: 0, lineHeight: 1,
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
