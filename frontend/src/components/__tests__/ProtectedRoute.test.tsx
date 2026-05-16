import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import { useAuthStore } from '../../store/authStore'

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

function renderWithRouter(initialEntry = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Secret Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no token', () => {
    renderWithRouter()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('renders outlet when token is present', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { id: '1', email: 'a@b.com', username: 'a' },
    })
    renderWithRouter()
    expect(screen.getByText('Secret Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).toBeNull()
  })

  it('redirects again after clearAuth', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: '1', email: 'a@b.com', username: 'a' },
    })
    const { rerender } = renderWithRouter()
    expect(screen.getByText('Secret Content')).toBeInTheDocument()

    useAuthStore.getState().clearAuth()
    rerender(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
