import client from './client'

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    username: string
    avatar_url?: string
    created_at?: string
  }
}

export const register = (data: { email: string; username: string; password: string }): Promise<AuthResponse> =>
  client.post('/auth/register', data).then((r) => r.data)

export const login = (data: { email: string; password: string }): Promise<AuthResponse> =>
  client.post('/auth/login', data).then((r) => r.data)

export const getMe = () => client.get('/users/me').then((r) => r.data)

export const updateMe = (data: { username?: string; avatar_url?: string }) =>
  client.patch('/users/me', data).then((r) => r.data)
