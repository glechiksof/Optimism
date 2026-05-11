interface FormErrorProps {
  message?: string
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
      {message}
    </p>
  )
}
