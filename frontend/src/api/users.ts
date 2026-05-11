import client from './client'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at?: string
}

export const getMe = (): Promise<User> => client.get('/users/me').then((r) => r.data)

export const updateMe = (data: { username?: string; avatar_url?: string }): Promise<User> =>
  client.patch('/users/me', data).then((r) => r.data)
