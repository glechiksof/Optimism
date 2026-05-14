import { AuthResponse } from './auth'
import { User } from './users'
import { Tournament, CreateTournamentData, UpdateTournamentData } from './tournaments'
import { Team, CreateTeamData } from './teams'

const MOCK_USERS_KEY = 'mock-users'
const MOCK_TOURNAMENTS_KEY = 'mock-tournaments'
const MOCK_TEAMS_KEY = 'mock-teams'
const MOCK_PARTICIPANTS_KEY = 'mock-participants'
const MOCK_MATCHES_KEY = 'mock-matches'
const MOCK_DELAY = 500

export interface MockParticipant {
  id: string
  tournament_id: string
  user_id?: string
  team_id?: string
  manual_name?: string
  registered_at: string
}

export interface MockMatch {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  participant_a: { id: string; user_id?: string; username?: string; manual_name?: string } | null
  participant_b: { id: string; user_id?: string; username?: string; manual_name?: string } | null
  winner_id: string | null
  status: 'pending' | 'completed'
  scheduled_at: string | null
}

function getMockParticipants(): MockParticipant[] {
  const stored = localStorage.getItem(MOCK_PARTICIPANTS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockParticipants(rows: MockParticipant[]) {
  localStorage.setItem(MOCK_PARTICIPANTS_KEY, JSON.stringify(rows))
}

function getMockMatches(): MockMatch[] {
  const stored = localStorage.getItem(MOCK_MATCHES_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockMatches(rows: MockMatch[]) {
  localStorage.setItem(MOCK_MATCHES_KEY, JSON.stringify(rows))
}

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
        status: 'draft',
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

export async function mockUpdateTournament(token: string, id: string, data: UpdateTournamentData): Promise<Tournament> {
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

function getMockTeams(): Team[] {
  const stored = localStorage.getItem(MOCK_TEAMS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockTeams(teams: Team[]) {
  localStorage.setItem(MOCK_TEAMS_KEY, JSON.stringify(teams))
}

export async function mockCreateTeam(token: string, data: CreateTeamData): Promise<Team> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      if (!userId) { reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } }); return }
      const now = new Date().toISOString()
      const manualMembers = (data.manual_members ?? []).map((m, i) => ({
        id: `manual-${Date.now()}-${i}`,
        manual_name: m.name,
        joined_at: now,
      }))
      if (manualMembers.length > data.capacity) {
        reject({ response: { data: { message: `Manual members exceed capacity` }, status: 422 } }); return
      }
      const team: Team = {
        id: Date.now().toString(),
        name: data.name,
        tournament_id: data.tournament_id,
        capacity: data.capacity,
        current_size: manualMembers.length,
        join_method: data.join_method as Team['join_method'],
        is_visible: data.is_visible,
        created_by: userId,
        members: manualMembers,
        created_at: now,
      }
      const all = getMockTeams()
      all.push(team)
      saveMockTeams(all)
      resolve(team)
    }, MOCK_DELAY)
  })
}

export async function mockGetTeam(id: string): Promise<Team> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const team = getMockTeams().find((t) => t.id === id)
      if (!team) reject({ response: { data: { detail: 'Not found' }, status: 404 } })
      else resolve(team)
    }, MOCK_DELAY)
  })
}

export async function mockListTeams(params?: { tournament_id?: string; visible_only?: boolean }): Promise<{ items: Team[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let items = getMockTeams()
      if (params?.tournament_id) items = items.filter((t) => t.tournament_id === params.tournament_id)
      if (params?.visible_only !== false) items = items.filter((t) => t.is_visible)
      resolve({ items, total: items.length })
    }, MOCK_DELAY)
  })
}

export async function mockJoinTeam(token: string, teamId: string): Promise<{ id: string; user_id: string; joined_at: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      if (!userId) { reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } }); return }
      const teams = getMockTeams()
      const team = teams.find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Team not found' }, status: 404 } }); return }
      if (team.join_method === 'manual') { reject({ response: { data: { message: 'Join is by manual invitation only' }, status: 403 } }); return }
      if (team.members.some((m) => m.user_id === userId)) { reject({ response: { data: { message: 'Already a member of this team' }, status: 409 } }); return }
      if (team.current_size >= team.capacity) { reject({ response: { data: { message: 'Team is full' }, status: 422 } }); return }
      const member = { id: Date.now().toString(), user_id: userId, joined_at: new Date().toISOString() }
      team.members.push(member)
      team.current_size += 1
      saveMockTeams(teams)
      resolve(member)
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

export async function mockJoinTournament(token: string, tournamentId: string, body: { team_id?: string | null }) {
  return new Promise<MockParticipant>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      if (!userId) { reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } }); return }
      const tournaments = getMockTournaments()
      const tournament = tournaments.find((t) => t.id === tournamentId)
      if (!tournament) { reject({ response: { data: { message: 'Tournament not found' }, status: 404 } }); return }
      if (!['open', 'published'].includes(tournament.status)) {
        reject({ response: { data: { message: 'Tournament is not open for registration' }, status: 422 } }); return
      }
      const participants = getMockParticipants()
      if (participants.some((p) => p.tournament_id === tournamentId && p.user_id === userId)) {
        reject({ response: { data: { message: 'Already registered for this tournament' }, status: 409 } }); return
      }
      if (tournament.current_participants >= tournament.max_participants) {
        reject({ response: { data: { message: 'Tournament is full' }, status: 422 } }); return
      }
      const participant: MockParticipant = {
        id: Date.now().toString(),
        tournament_id: tournamentId,
        user_id: userId,
        team_id: body.team_id ?? undefined,
        registered_at: new Date().toISOString(),
      }
      participants.push(participant)
      saveMockParticipants(participants)
      tournament.current_participants += 1
      saveMockTournaments(tournaments)
      resolve(participant)
    }, MOCK_DELAY)
  })
}

export async function mockListParticipants(tournamentId: string) {
  return new Promise<{ items: MockParticipant[]; total: number }>((resolve) => {
    setTimeout(() => {
      const items = getMockParticipants().filter((p) => p.tournament_id === tournamentId)
      resolve({ items, total: items.length })
    }, MOCK_DELAY)
  })
}

export async function mockParticipationStatus(token: string, tournamentId: string) {
  return new Promise<{ is_participant: boolean; participant_id: string | null }>((resolve) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const found = getMockParticipants().find((p) => p.tournament_id === tournamentId && p.user_id === userId)
      resolve({ is_participant: !!found, participant_id: found?.id ?? null })
    }, MOCK_DELAY)
  })
}

export async function mockGenerateMatches(token: string, tournamentId: string) {
  return new Promise<{ items: MockMatch[]; total: number }>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const tournaments = getMockTournaments()
      const tournament = tournaments.find((t) => t.id === tournamentId)
      if (!tournament) { reject({ response: { data: { message: 'Tournament not found' }, status: 404 } }); return }
      if (tournament.organizer_id !== userId) { reject({ response: { data: { message: 'Only the organizer can perform this action' }, status: 403 } }); return }
      const allMatches = getMockMatches()
      if (allMatches.some((m) => m.tournament_id === tournamentId)) {
        reject({ response: { data: { message: 'Matches already generated' }, status: 409 } }); return
      }
      const participants = getMockParticipants().filter((p) => p.tournament_id === tournamentId)
      if (participants.length < 2) {
        reject({ response: { data: { message: 'Need at least 2 participants to generate matches' }, status: 422 } }); return
      }
      const users = getMockUsers()
      const shuffled = [...participants].sort(() => Math.random() - 0.5)
      const n = shuffled.length
      const numRounds = Math.ceil(Math.log2(n))
      const bracket = 2 ** numRounds
      const byes = bracket - n
      const playing = shuffled.slice(byes)
      const byeParticipants = shuffled.slice(0, byes)
      const firstRoundCount = Math.floor(playing.length / 2)
      const newMatches: MockMatch[] = []

      function infoFor(p: MockParticipant) {
        const u = p.user_id ? users.find((x) => x.id === p.user_id) : undefined
        return { id: p.id, user_id: p.user_id, username: u?.username, manual_name: p.manual_name }
      }

      for (let i = 0; i < firstRoundCount; i++) {
        newMatches.push({
          id: `${Date.now()}-1-${i + 1}`,
          tournament_id: tournamentId,
          round_number: 1,
          match_number: i + 1,
          participant_a: infoFor(playing[i * 2]),
          participant_b: infoFor(playing[i * 2 + 1]),
          winner_id: null,
          status: 'pending',
          scheduled_at: null,
        })
      }
      let prev = firstRoundCount + byes
      for (let r = 2; r <= numRounds; r++) {
        const cnt = Math.max(Math.floor(prev / 2), 1)
        for (let i = 0; i < cnt; i++) {
          newMatches.push({
            id: `${Date.now()}-${r}-${i + 1}`,
            tournament_id: tournamentId,
            round_number: r,
            match_number: i + 1,
            participant_a: null,
            participant_b: null,
            winner_id: null,
            status: 'pending',
            scheduled_at: null,
          })
        }
        prev = cnt
      }
      // Seed byes into round 2.
      if (byes) {
        const round2 = newMatches.filter((m) => m.round_number === 2)
        let slot = 0
        for (const bp of byeParticipants) {
          if (slot >= round2.length * 2) break
          const m = round2[Math.floor(slot / 2)]
          if (slot % 2 === 0) m.participant_a = infoFor(bp)
          else m.participant_b = infoFor(bp)
          slot++
        }
      }
      allMatches.push(...newMatches)
      saveMockMatches(allMatches)
      resolve({ items: newMatches, total: newMatches.length })
    }, MOCK_DELAY)
  })
}

export async function mockListMatches(tournamentId: string) {
  return new Promise<{ items: MockMatch[]; total: number }>((resolve) => {
    setTimeout(() => {
      const items = getMockMatches()
        .filter((m) => m.tournament_id === tournamentId)
        .sort((a, b) => a.round_number - b.round_number || a.match_number - b.match_number)
      resolve({ items, total: items.length })
    }, MOCK_DELAY)
  })
}
