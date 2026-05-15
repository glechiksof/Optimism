import client from './client'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at: string
}

export const getMe = (): Promise<User> => client.get('/users/me').then((r) => r.data)

export const updateMe = (data: { username?: string; avatar_url?: string }): Promise<User> =>
  client.patch('/users/me', data).then((r) => r.data)

export interface UserStats {
  tournaments_organized: number
  tournaments_joined: number
  tournaments_won: number
  matches_played: number
  matches_won: number
}

export const getMyStats = (): Promise<UserStats> =>
  client.get('/users/me/stats').then((r) => r.data)
