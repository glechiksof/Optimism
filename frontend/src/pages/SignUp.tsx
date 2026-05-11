import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function SignUp() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await register({ email, username, password })
      setAuth(res.access_token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__panel--left">
        <img src="/title+logo.png" alt="Tournaments Organizer" style={{ height: 48, marginBottom: '3rem' }} />
        <img src="/bg-left.png" alt="" style={{ width: '70%', maxWidth: 320 }} />
        <h2 style={{ color: '#fff', marginTop: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>
          Create, Join and Play
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem', textAlign: 'center', lineHeight: 1.6 }}>
          Find team to play in your city and create tournament brackets conveniently
        </p>
      </div>
      <div className="auth-layout__panel--right">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
            Join Us
          </h1>
          <form aria-label="signup form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Username"
              type="text"
              placeholder="johndadev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Email"
              type="email"
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              CREATE ACCOUNT
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700 }}>Jump right in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
