interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export default function Button({ variant = 'primary', loading = false, children, ...props }: ButtonProps) {
  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: '#fff',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-primary)',
    },
  }

  return (
    <button
      style={{
        width: '100%',
        padding: '0.85rem',
        borderRadius: 'var(--border-radius)',
        fontWeight: 700,
        fontSize: '0.9rem',
        letterSpacing: '0.05em',
        border: 'none',
        cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        opacity: loading || props.disabled ? 0.7 : 1,
        ...variants[variant],
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
