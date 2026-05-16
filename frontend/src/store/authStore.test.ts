import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  username: 'testuser',
}

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

describe('authStore', () => {
  it('has null token and user initially', () => {
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })

  it('setAuth stores token and user', () => {
    useAuthStore.getState().setAuth('mytoken', mockUser)
    const { token, user } = useAuthStore.getState()
    expect(token).toBe('mytoken')
    expect(user).toEqual(mockUser)
  })

  it('clearAuth resets to null', () => {
    useAuthStore.getState().setAuth('mytoken', mockUser)
    useAuthStore.getState().clearAuth()
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })

  it('setAuth overwrites previous values', () => {
    useAuthStore.getState().setAuth('first', mockUser)
    const newUser = { ...mockUser, username: 'updated' }
    useAuthStore.getState().setAuth('second', newUser)
    expect(useAuthStore.getState().token).toBe('second')
    expect(useAuthStore.getState().user?.username).toBe('updated')
  })
})
