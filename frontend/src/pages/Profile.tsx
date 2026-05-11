import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateMe } from '../api/users'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const [username, setUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setUsername(user.username)
    }
  }, [user])

  const handleSave = async () => {
    setError('')
    setSuccess('')

    if (!username.trim()) {
      setError('Username cannot be empty')
      return
    }

    setLoading(true)
    try {
      const updated = await updateMe({ username })
      if (token && user) {
        setAuth(token, { ...user, ...updated })
      }
      setSuccess('Profile updated!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="container">Loading...</div>
  }

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>My Profile</h1>

      <div
        style={{
          maxWidth: 500,
          background: 'var(--color-surface)',
          padding: '2rem',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '2rem',
              margin: '0 auto',
            }}
          >
            {initials}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Email
          </label>
          <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>{user.email}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Username
          </label>
          {isEditing ? (
            <Input
              label=""
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="Enter username"
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>{user.username}</p>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                ✏️ Edit
              </button>
            </div>
          )}
        </div>

        {user.created_at && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Member Since
            </label>
            <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {error && <FormError message={error} />}
        {success && <p style={{ color: 'var(--color-success)', fontSize: '0.875rem', marginBottom: '1rem' }}>{success}</p>}

        {isEditing && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false)
                setUsername(user.username)
                setError('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
