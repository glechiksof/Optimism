import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountMenu({ isOpen, onClose }: AccountMenuProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  if (!isOpen) return null

  const initials = user?.username?.slice(0, 2).toUpperCase() || '?'

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '0.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1000,
        minWidth: 200,
      }}
    >
      <div style={{ padding: '0.75rem' }}>
        {user && (
          <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                {initials}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>{user.username}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/profile"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '0.5rem 0.75rem',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            borderRadius: 'var(--border-radius)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-border)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          👤 Profile
        </Link>

        <Link
          to="/statistics"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '0.5rem 0.75rem',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            borderRadius: 'var(--border-radius)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-border)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          📊 Statistics
        </Link>

        <button
          onClick={() => {
            handleLogout()
            onClose()
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-border)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}
