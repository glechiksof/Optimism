import { AuthResponse } from './auth'
import { User } from './users'

const MOCK_USERS_KEY = 'mock-users'
const MOCK_DELAY = 500

export function initMockData() {
  const stored = localStorage.getItem(MOCK_USERS_KEY)
  if (!stored) {
    localStorage.setItem(
      MOCK_USERS_KEY,
      JSON.stringify([
        { id: '1', email: 'demo@example.com', username: 'demo', password: 'password123', created_at: new Date().toISOString() },
      ])
    )
  }
}

function getMockUsers(): Array<User & { password: string }> {
  const stored = localStorage.getItem(MOCK_USERS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockUsers(users: Array<User & { password: string }>) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

export async function mockRegister(data: { email: string; username: string; password: string }): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()

      if (users.find((u) => u.email === data.email)) {
        reject({ response: { data: { detail: 'Email already registered' }, status: 400 } })
        return
      }

      if (users.find((u) => u.username === data.username)) {
        reject({ response: { data: { detail: 'Username already taken' }, status: 400 } })
        return
      }

      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        email: data.email,
        username: data.username,
        password: data.password,
        created_at: new Date().toISOString(),
      }

      users.push(newUser)
      saveMockUsers(users)

      resolve({
        access_token: 'mock-token-' + newUser.id,
        token_type: 'Bearer',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          created_at: newUser.created_at,
        },
      })
    }, MOCK_DELAY)
  })
}

export async function mockLogin(data: { email: string; password: string }): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()
      const user = users.find((u) => u.email === data.email && u.password === data.password)

      if (!user) {
        reject({ response: { data: { detail: 'Invalid email or password' }, status: 401 } })
        return
      }

      resolve({
        access_token: 'mock-token-' + user.id,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at,
        },
      })
    }, MOCK_DELAY)
  })
}

export async function mockGetMe(token: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()
      const userId = token.replace('mock-token-', '')
      const user = users.find((u) => u.id === userId)

      if (!user) {
        reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } })
        return
      }

      resolve({
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      })
    }, MOCK_DELAY)
  })
}

export async function mockUpdateMe(token: string, data: { username?: string; avatar_url?: string }): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()
      const userId = token.replace('mock-token-', '')
      const user = users.find((u) => u.id === userId)

      if (!user) {
        reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } })
        return
      }

      if (data.username) {
        if (users.some((u) => u.id !== user.id && u.username === data.username)) {
          reject({ response: { data: { detail: 'Username already taken' }, status: 400 } })
          return
        }
        user.username = data.username
      }

      if (data.avatar_url) {
        user.avatar_url = data.avatar_url
      }

      saveMockUsers(users)

      resolve({
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      })
    }, MOCK_DELAY)
  })
}
