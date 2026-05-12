import { AuthResponse } from './auth'
import { User } from './users'
import { Tournament, CreateTournamentData } from './tournaments'

const MOCK_USERS_KEY = 'mock-users'
const MOCK_TOURNAMENTS_KEY = 'mock-tournaments'
const MOCK_DELAY = 500

export function initMockData() {
  const stored = localStorage.getItem(MOCK_USERS_KEY)
  if (!stored) {
    localStorage.setItem(
      MOCK_USERS_KEY,
      JSON.stringify([
        { id: '1', email: 'demo@example.com', username: 'demo', password: 'password123', created_at: new Date().toISOString() },
        { id: '2', email: 'player@test.com', username: 'player', password: 'Test1234!', created_at: new Date().toISOString() },
        { id: '3', email: 'organizer@test.com', username: 'organizer', password: 'Test1234!', created_at: new Date().toISOString() },
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

function getMockTournaments(): Tournament[] {
  const stored = localStorage.getItem(MOCK_TOURNAMENTS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockTournaments(tournaments: Tournament[]) {
  localStorage.setItem(MOCK_TOURNAMENTS_KEY, JSON.stringify(tournaments))
}

function getUserIdFromToken(token: string): string {
  return token.replace('mock-token-', '')
}

export async function mockCreateTournament(token: string, data: CreateTournamentData): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      if (!userId) {
        reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } })
        return
      }
      const now = new Date().toISOString()
      const tournament: Tournament = {
        id: Date.now().toString(),
        organizer_id: userId,
        name: data.name,
        sport_type: data.sport_type,
        bracket_type: data.bracket_type as Tournament['bracket_type'],
        description: data.description,
        max_participants: data.max_participants,
        current_participants: 0,
        start_date: data.start_date,
        end_date: data.end_date,
        status: (data.status as Tournament['status']) ?? 'draft',
        is_visible: data.is_visible,
        created_at: now,
        updated_at: now,
      }
      const all = getMockTournaments()
      all.push(tournament)
      saveMockTournaments(all)
      resolve(tournament)
    }, MOCK_DELAY)
  })
}

export async function mockUpdateTournament(token: string, id: string, data: Partial<CreateTournamentData>): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const all = getMockTournaments()
      const idx = all.findIndex((t) => t.id === id)
      if (idx === -1) {
        reject({ response: { data: { detail: 'Not found' }, status: 404 } })
        return
      }
      if (all[idx].organizer_id !== userId) {
        reject({ response: { data: { detail: 'Forbidden' }, status: 403 } })
        return
      }
      all[idx] = {
        ...all[idx],
        ...data,
        bracket_type: (data.bracket_type ?? all[idx].bracket_type) as Tournament['bracket_type'],
        status: (data.status ?? all[idx].status) as Tournament['status'],
        updated_at: new Date().toISOString(),
      }
      saveMockTournaments(all)
      resolve(all[idx])
    }, MOCK_DELAY)
  })
}

export async function mockListTournaments(search?: string): Promise<{ items: Tournament[]; total: number; page: number; page_size: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let items = getMockTournaments().filter(
        (t) => t.status !== 'draft' && t.is_visible
      )
      if (search) {
        const q = search.toLowerCase()
        items = items.filter((t) => t.name.toLowerCase().includes(q))
      }
      resolve({ items, total: items.length, page: 1, page_size: 20 })
    }, MOCK_DELAY)
  })
}

export async function mockGetHostedTournaments(token: string): Promise<Tournament[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const items = getMockTournaments().filter((t) => t.organizer_id === userId)
      resolve(items)
    }, MOCK_DELAY)
  })
}

export async function mockGetTournament(id: string): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const t = getMockTournaments().find((t) => t.id === id)
      if (!t) reject({ response: { data: { detail: 'Not found' }, status: 404 } })
      else resolve(t)
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
