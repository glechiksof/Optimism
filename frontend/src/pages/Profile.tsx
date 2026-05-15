import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateMe } from '../api/users'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'

const MAX_AVATAR_BYTES = 200 * 1024  // 200 KB cap on base64 payload to keep DB row small

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const [username, setUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > MAX_AVATAR_BYTES) {
      setError(`Avatar too large (max ${Math.round(MAX_AVATAR_BYTES / 1024)} KB)`)
      return
    }
    setError('')
    setAvatarUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const updated = await updateMe({ avatar_url: dataUrl })
      if (token && user) {
        setAuth(token, { ...user, ...updated })
      }
      setSuccess('Avatar updated')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="avatar"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '2rem', margin: '0 auto',
              }}
            >
              {initials}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            style={{
              marginTop: '0.75rem', background: 'none',
              color: 'var(--color-primary)', border: 'none',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {avatarUploading ? 'Uploading...' : (user.avatar_url ? 'Change avatar' : 'Upload avatar')}
          </button>
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
