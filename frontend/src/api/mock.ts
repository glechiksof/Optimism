import { AuthResponse } from './auth'
import { User } from './users'
import { Tournament, CreateTournamentData, UpdateTournamentData } from './tournaments'
import { Team, CreateTeamData } from './teams'

const MOCK_USERS_KEY = 'mock-users'
const MOCK_TOURNAMENTS_KEY = 'mock-tournaments'
const MOCK_TEAMS_KEY = 'mock-teams'
const MOCK_PARTICIPANTS_KEY = 'mock-participants'
const MOCK_MATCHES_KEY = 'mock-matches'
const MOCK_DELAY = 120

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

export async function mockJoinTeam(authToken: string, teamId: string, joinTokenStr: string | null): Promise<{ id: string; user_id: string; joined_at: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(authToken)
      if (!userId) { reject({ response: { data: { detail: 'Unauthorized' }, status: 401 } }); return }
      const teams = getMockTeams()
      const team = teams.find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Team not found' }, status: 404 } }); return }

      let consumedTokenId: string | null = null

      // Method-specific guards
      if (team.join_method === 'manual') {
        reject({ response: { data: { message: 'Join is by manual invitation only' }, status: 403 } }); return
      } else if (team.join_method === 'link') {
        if (!joinTokenStr) {
          reject({ response: { data: { message: 'Token required for link join' }, status: 400 } }); return
        }
        const tokRows = getMockTokens()
        const row = tokRows.find((t) => t.token === joinTokenStr)
        if (!row || row.team_id !== teamId) {
          reject({ response: { data: { message: 'Invalid token' }, status: 400 } }); return
        }
        if (!row.is_active) {
          reject({ response: { data: { message: 'Token is inactive' }, status: 400 } }); return
        }
        if (row.used_at) {
          reject({ response: { data: { message: 'Token has already been used' }, status: 400 } }); return
        }
        if (new Date(row.expires_at) < new Date()) {
          reject({ response: { data: { message: 'Token expired' }, status: 400 } }); return
        }
        consumedTokenId = row.id
      } else if (team.join_method === 'mixed') {
        if (joinTokenStr) {
          const tokRows = getMockTokens()
          const row = tokRows.find((t) => t.token === joinTokenStr && t.team_id === teamId)
          if (!row || !row.is_active || row.used_at || new Date(row.expires_at) < new Date()) {
            reject({ response: { data: { message: 'Invalid or used token' }, status: 400 } }); return
          }
          consumedTokenId = row.id
        }
      }
      // team_page: no token check

      if (team.members.some((m) => m.user_id === userId)) {
        reject({ response: { data: { message: 'Already a member of this team' }, status: 409 } }); return
      }
      if (team.current_size >= team.capacity) {
        reject({ response: { data: { message: 'Team is full' }, status: 422 } }); return
      }

      const member = { id: Date.now().toString(), user_id: userId, joined_at: new Date().toISOString() }
      team.members.push(member)
      team.current_size += 1
      saveMockTeams(teams)

      // Single-use: deactivate token after successful consumption
      if (consumedTokenId) {
        const tokRows = getMockTokens()
        const row = tokRows.find((t) => t.id === consumedTokenId)
        if (row) {
          row.used_at = new Date().toISOString()
          row.is_active = false
          saveMockTokens(tokRows)
        }
      }
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
      if (tournament.status !== 'open') {
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

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS: Record<string, string> = {
  publish: 'open',
  close: 'closed',
  start: 'started',
}
const VALID_FROM: Record<string, string> = {
  publish: 'draft',
  close: 'open',
  start: 'closed',
}

export async function mockTransition(token: string, tournamentId: string, action: 'publish' | 'close' | 'start') {
  return new Promise<Tournament>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const all = getMockTournaments()
      const idx = all.findIndex((t) => t.id === tournamentId)
      if (idx === -1) { reject({ response: { data: { message: 'Tournament not found' }, status: 404 } }); return }
      const t = all[idx]
      if (t.organizer_id !== userId) { reject({ response: { data: { message: 'Only the organizer' }, status: 403 } }); return }
      if (t.status !== VALID_FROM[action]) {
        reject({ response: { data: { message: `Cannot ${action} from status '${t.status}'` }, status: 422 } }); return
      }
      if (action === 'start') {
        const matches = getMockMatches().filter((m) => m.tournament_id === tournamentId)
        if (matches.length === 0) {
          reject({ response: { data: { message: 'Generate the bracket before starting' }, status: 422 } }); return
        }
      }
      t.status = ALLOWED_TRANSITIONS[action] as Tournament['status']
      t.updated_at = new Date().toISOString()
      saveMockTournaments(all)
      resolve(t)
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Leave / kick
// ---------------------------------------------------------------------------
export async function mockLeaveTournament(token: string, tournamentId: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const parts = getMockParticipants()
      const idx = parts.findIndex((p) => p.tournament_id === tournamentId && p.user_id === userId)
      if (idx === -1) { reject({ response: { data: { message: 'Not registered' }, status: 404 } }); return }
      const tournaments = getMockTournaments()
      const t = tournaments.find((x) => x.id === tournamentId)
      if (t && !['open', 'closed'].includes(t.status)) {
        reject({ response: { data: { message: 'Cannot leave after the tournament has started' }, status: 422 } }); return
      }
      parts.splice(idx, 1)
      saveMockParticipants(parts)
      if (t && t.current_participants > 0) {
        t.current_participants -= 1
        saveMockTournaments(tournaments)
      }
      resolve()
    }, MOCK_DELAY)
  })
}

export async function mockRemoveParticipant(token: string, tournamentId: string, participantId: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const tournaments = getMockTournaments()
      const t = tournaments.find((x) => x.id === tournamentId)
      if (!t) { reject({ response: { data: { message: 'Not found' }, status: 404 } }); return }
      if (t.organizer_id !== userId) { reject({ response: { data: { message: 'Only the organizer' }, status: 403 } }); return }
      if (!['open', 'closed'].includes(t.status)) {
        reject({ response: { data: { message: 'Cannot remove participants after start' }, status: 422 } }); return
      }
      const parts = getMockParticipants()
      const idx = parts.findIndex((p) => p.id === participantId && p.tournament_id === tournamentId)
      if (idx === -1) { reject({ response: { data: { message: 'Participant not found' }, status: 404 } }); return }
      parts.splice(idx, 1)
      saveMockParticipants(parts)
      if (t.current_participants > 0) {
        t.current_participants -= 1
        saveMockTournaments(tournaments)
      }
      resolve()
    }, MOCK_DELAY)
  })
}

export async function mockLeaveTeam(token: string, teamId: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const teams = getMockTeams()
      const team = teams.find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Team not found' }, status: 404 } }); return }
      if (team.created_by === userId) {
        reject({ response: { data: { message: 'Creator cannot leave; delete instead' }, status: 422 } }); return
      }
      const memberIdx = team.members.findIndex((m) => m.user_id === userId)
      if (memberIdx === -1) { reject({ response: { data: { message: 'Not a member' }, status: 404 } }); return }
      team.members.splice(memberIdx, 1)
      if (team.current_size > 0) team.current_size -= 1
      saveMockTeams(teams)
      resolve()
    }, MOCK_DELAY)
  })
}

export async function mockRemoveMember(token: string, teamId: string, memberId: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const teams = getMockTeams()
      const team = teams.find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Not found' }, status: 404 } }); return }
      if (team.created_by !== userId) { reject({ response: { data: { message: 'Only creator' }, status: 403 } }); return }
      const memberIdx = team.members.findIndex((m) => m.id === memberId)
      if (memberIdx === -1) { reject({ response: { data: { message: 'Member not found' }, status: 404 } }); return }
      if (team.members[memberIdx].user_id === userId) {
        reject({ response: { data: { message: 'Creator cannot be removed' }, status: 422 } }); return
      }
      team.members.splice(memberIdx, 1)
      if (team.current_size > 0) team.current_size -= 1
      saveMockTeams(teams)
      resolve()
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const MOCK_TOKENS_KEY = 'mock-tokens'

interface MockToken {
  id: string
  team_id: string
  token: string
  expires_at: string
  used_at: string | null
  is_active: boolean
}

function getMockTokens(): MockToken[] {
  const stored = localStorage.getItem(MOCK_TOKENS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockTokens(rows: MockToken[]) {
  localStorage.setItem(MOCK_TOKENS_KEY, JSON.stringify(rows))
}

function randomToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(36)).join('').slice(0, 43)
}

export async function mockGenerateToken(token: string, teamId: string) {
  return new Promise<MockToken>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const team = getMockTeams().find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Not found' }, status: 404 } }); return }
      if (team.created_by !== userId) { reject({ response: { data: { message: 'Only creator' }, status: 403 } }); return }
      const row: MockToken = {
        id: Date.now().toString(),
        team_id: teamId,
        token: randomToken(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        used_at: null,
        is_active: true,
      }
      const all = getMockTokens()
      all.push(row)
      saveMockTokens(all)
      resolve(row)
    }, MOCK_DELAY)
  })
}

export async function mockGetTokens(token: string, teamId: string) {
  return new Promise<MockToken[]>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const team = getMockTeams().find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Not found' }, status: 404 } }); return }
      if (team.created_by !== userId) { reject({ response: { data: { message: 'Only creator' }, status: 403 } }); return }
      resolve(getMockTokens().filter((t) => t.team_id === teamId))
    }, MOCK_DELAY)
  })
}

export async function mockRevokeToken(token: string, teamId: string, tokenId: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const team = getMockTeams().find((t) => t.id === teamId)
      if (!team) { reject({ response: { data: { message: 'Not found' }, status: 404 } }); return }
      if (team.created_by !== userId) { reject({ response: { data: { message: 'Only creator' }, status: 403 } }); return }
      const all = getMockTokens()
      const row = all.find((r) => r.id === tokenId && r.team_id === teamId)
      if (!row) { reject({ response: { data: { message: 'Token not found' }, status: 404 } }); return }
      row.is_active = false
      saveMockTokens(all)
      resolve()
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Joined tournaments (single call for OngoingTournaments + joined sub-tab)
// ---------------------------------------------------------------------------
export async function mockJoinedTournaments(token: string) {
  return new Promise<Tournament[]>((resolve) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const myParticipations = getMockParticipants().filter((p) => p.user_id === userId)
      const tournamentIds = new Set(myParticipations.map((p) => p.tournament_id))
      const items = getMockTournaments().filter((t) => tournamentIds.has(t.id))
      resolve(items)
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export async function mockMyStats(token: string) {
  return new Promise<{ tournaments_organized: number; tournaments_joined: number; tournaments_won: number; matches_played: number; matches_won: number }>((resolve) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const organized = getMockTournaments().filter((t) => t.organizer_id === userId).length
      const myParts = getMockParticipants().filter((p) => p.user_id === userId)
      const partIds = new Set(myParts.map((p) => p.id))
      const matches = getMockMatches().filter(
        (m) => m.status === 'completed' && (
          (m.participant_a && partIds.has(m.participant_a.id)) ||
          (m.participant_b && partIds.has(m.participant_b.id))
        )
      )
      const matches_won = matches.filter((m) => m.winner_id && partIds.has(m.winner_id)).length
      resolve({
        tournaments_organized: organized,
        tournaments_joined: myParts.length,
        tournaments_won: 0,  // not computed in mock
        matches_played: matches.length,
        matches_won,
      })
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Mutators missing from earlier mock-adapter passes
// ---------------------------------------------------------------------------
export async function mockUpdateTeam(token: string, id: string, data: { name?: string; capacity?: number; join_method?: string; is_visible?: boolean }) {
  return new Promise<Team>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const all = getMockTeams()
      const idx = all.findIndex((t) => t.id === id)
      if (idx === -1) { reject({ response: { data: { message: 'Team not found' }, status: 404 } }); return }
      const team = all[idx]
      if (team.created_by !== userId) { reject({ response: { data: { message: 'Only team creator can update' }, status: 403 } }); return }
      if (data.capacity !== undefined && data.capacity < team.members.length) {
        reject({ response: { data: { message: `Cannot reduce capacity to ${data.capacity}: team has ${team.members.length} members` }, status: 422 } }); return
      }
      Object.assign(team, data)
      saveMockTeams(all)
      resolve(team)
    }, MOCK_DELAY)
  })
}

export async function mockDeleteTeam(token: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const all = getMockTeams()
      const idx = all.findIndex((t) => t.id === id)
      if (idx === -1) { reject({ response: { data: { message: 'Team not found' }, status: 404 } }); return }
      if (all[idx].created_by !== userId) { reject({ response: { data: { message: 'Only team creator can delete' }, status: 403 } }); return }
      all.splice(idx, 1)
      saveMockTeams(all)
      // Cascade clean local stores
      saveMockTokens(getMockTokens().filter((t) => t.team_id !== id))
      resolve()
    }, MOCK_DELAY)
  })
}

export async function mockDeleteTournament(token: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const all = getMockTournaments()
      const idx = all.findIndex((t) => t.id === id)
      if (idx === -1) { reject({ response: { data: { message: 'Tournament not found' }, status: 404 } }); return }
      const t = all[idx]
      if (t.organizer_id !== userId) { reject({ response: { data: { message: 'Not the organizer' }, status: 403 } }); return }
      if (['started', 'finished'].includes(t.status)) {
        reject({ response: { data: { message: 'Cannot delete a tournament that has started' }, status: 422 } }); return
      }
      all.splice(idx, 1)
      saveMockTournaments(all)
      // Cascade: drop participants + matches tied to this tournament
      saveMockParticipants(getMockParticipants().filter((p) => p.tournament_id !== id))
      saveMockMatches(getMockMatches().filter((m) => m.tournament_id !== id))
      resolve()
    }, MOCK_DELAY)
  })
}

export async function mockSubmitMatchResult(token: string, tournamentId: string, matchId: string, winnerParticipantId: string) {
  return new Promise<MockMatch>((resolve, reject) => {
    setTimeout(() => {
      const userId = getUserIdFromToken(token)
      const tournament = getMockTournaments().find((t) => t.id === tournamentId)
      if (!tournament) { reject({ response: { data: { message: 'Tournament not found' }, status: 404 } }); return }
      if (tournament.organizer_id !== userId) { reject({ response: { data: { message: 'Only the organizer can perform this action' }, status: 403 } }); return }
      const allMatches = getMockMatches()
      const m = allMatches.find((x) => x.id === matchId && x.tournament_id === tournamentId)
      if (!m) { reject({ response: { data: { message: 'Match not found' }, status: 404 } }); return }
      if (m.status === 'completed') { reject({ response: { data: { message: 'Match already completed' }, status: 409 } }); return }
      const validIds = [m.participant_a?.id, m.participant_b?.id].filter(Boolean)
      if (!validIds.includes(winnerParticipantId)) {
        reject({ response: { data: { message: 'Winner must be a participant of this match' }, status: 422 } }); return
      }
      m.winner_id = winnerParticipantId
      m.status = 'completed'

      // Advance via formula: target round R+1 match number = (m.match_number + 1) // 2.
      const target = allMatches.find((x) =>
        x.tournament_id === tournamentId &&
        x.round_number === m.round_number + 1 &&
        x.match_number === Math.floor((m.match_number + 1) / 2),
      )
      if (target) {
        const winnerInfo = m.participant_a?.id === winnerParticipantId ? m.participant_a : m.participant_b
        if (!target.participant_a) target.participant_a = winnerInfo!
        else if (!target.participant_b) target.participant_b = winnerInfo!
      }

      // Auto-finish: if no pending matches remain, transition tournament.
      const stillPending = allMatches.some((x) => x.tournament_id === tournamentId && x.status !== 'completed')
      if (!stillPending) {
        const tIdx = getMockTournaments().findIndex((t) => t.id === tournamentId)
        if (tIdx !== -1) {
          const ts = getMockTournaments()
          ts[tIdx].status = 'finished'
          saveMockTournaments(ts)
        }
      }

      saveMockMatches(allMatches)
      resolve(m)
    }, MOCK_DELAY)
  })
}

// ---------------------------------------------------------------------------
// Standings (round-robin)
// ---------------------------------------------------------------------------
interface MockStandingsRow {
  participant_id: string
  username?: string
  manual_name?: string
  wins: number
  losses: number
  played: number
}

export async function mockStandings(tournamentId: string) {
  return new Promise<{ items: MockStandingsRow[] }>((resolve) => {
    setTimeout(() => {
      const matches = getMockMatches().filter((m) => m.tournament_id === tournamentId && m.status === 'completed')
      const stats: Record<string, MockStandingsRow> = {}
      for (const p of getMockParticipants().filter((p) => p.tournament_id === tournamentId)) {
        const user = getMockUsers().find((u) => u.id === p.user_id)
        stats[p.id] = {
          participant_id: p.id,
          username: user?.username,
          manual_name: p.manual_name,
          wins: 0, losses: 0, played: 0,
        }
      }
      for (const m of matches) {
        if (!m.winner_id) continue
        const loser = m.winner_id === m.participant_a?.id ? m.participant_b?.id : m.participant_a?.id
        if (stats[m.winner_id]) { stats[m.winner_id].wins++; stats[m.winner_id].played++ }
        if (loser && stats[loser]) { stats[loser].losses++; stats[loser].played++ }
      }
      const rows = Object.values(stats).sort((a, b) => b.wins - a.wins || a.losses - b.losses)
      resolve({ items: rows })
    }, MOCK_DELAY)
  })
}
