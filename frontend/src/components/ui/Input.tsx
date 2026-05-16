interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      <input
        style={{
          width: '100%',
          padding: '0.5rem 0',
          border: 'none',
          borderBottom: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          fontSize: '1rem',
          outline: 'none',
          background: 'transparent',
        }}
        {...props}
      />
      {error && <p style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  )
}
