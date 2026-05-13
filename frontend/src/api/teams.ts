import client from './client'

export interface TeamMember {
  id: string
  user_id?: string
  manual_name?: string
  joined_at: string
}

export interface Team {
  id: string
  name: string
  tournament_id?: string
  capacity: number
  current_size: number
  join_method: 'manual' | 'team_page' | 'link' | 'mixed'
  is_visible: boolean
  created_by: string
  members: TeamMember[]
  created_at: string
}

export interface TeamListResponse {
  items: Team[]
  total: number
}

export interface CreateTeamData {
  tournament_id?: string
  name: string
  capacity: number
  join_method: string
  is_visible: boolean
  manual_members: { name: string }[]
}

export interface UpdateTeamData {
  name?: string
  capacity?: number
  join_method?: string
  is_visible?: boolean
}

export interface JoinToken {
  id: string
  token: string
  expires_at: string
}

export async function createTeam(data: CreateTeamData): Promise<Team> {
  const res = await client.post<Team>('/teams', data)
  return res.data
}

export async function getTeam(id: string): Promise<Team> {
  const res = await client.get<Team>(`/teams/${id}`)
  return res.data
}

export async function listTeams(params?: { tournament_id?: string; visible_only?: boolean }): Promise<TeamListResponse> {
  const res = await client.get<TeamListResponse>('/teams', { params })
  return res.data
}

export async function updateTeam(id: string, data: UpdateTeamData): Promise<Team> {
  const res = await client.patch<Team>(`/teams/${id}`, data)
  return res.data
}

export async function deleteTeam(id: string): Promise<void> {
  await client.delete(`/teams/${id}`)
}

export async function joinTeam(id: string, token?: string): Promise<TeamMember> {
  const res = await client.post<TeamMember>(`/teams/${id}/join`, { token: token ?? null })
  return res.data
}

export async function generateToken(id: string): Promise<JoinToken> {
  const res = await client.post<JoinToken>(`/teams/${id}/tokens`)
  return res.data
}

export async function getTokens(id: string): Promise<JoinToken[]> {
  const res = await client.get<JoinToken[]>(`/teams/${id}/tokens`)
  return res.data
}
