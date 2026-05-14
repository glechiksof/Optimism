import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await login({ email, password })
      setAuth(res.access_token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__panel--left">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 420 }}>
          <img src="/title+logo.png" alt="Tournament Organizer" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
          <img src="/banana.png" alt="" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginTop: '0.5rem' }}>
            Create, Join and Play
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.6, marginTop: '-0.5rem' }}>
            Find a team to play in your city and create tournament brackets conveniently
          </p>
        </div>
      </div>
      <div className="auth-layout__panel--right">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
            Welcome Back!
          </h1>
          <form aria-label="login form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              SIGN IN
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ fontWeight: 700 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
