interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
}

export default function Select({ label, options, error, ...props }: SelectProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      <select
        style={{
          width: '100%',
          padding: '0.5rem 0',
          border: 'none',
          borderBottom: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          fontSize: '1rem',
          outline: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  )
}
