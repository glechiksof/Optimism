import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  variant?: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, variant = 'success', onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const bg = variant === 'success' ? 'var(--color-success)' : 'var(--color-error)'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: bg,
        color: '#fff',
        padding: '0.875rem 1.25rem',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '0.9rem',
        fontWeight: 500,
        zIndex: 1000,
        transition: 'opacity 300ms ease',
        opacity: visible ? 1 : 0,
        maxWidth: 320,
      }}
    >
      {message}
    </div>
  )
}
