import client from './client'

export interface Tournament {
  id: string
  organizer_id: string
  name: string
  sport_type: string
  bracket_type: 'single_elim' | 'round_robin'
  description?: string
  max_participants: number
  current_participants: number
  start_date: string
  end_date: string
  status: 'draft' | 'open' | 'closed' | 'started' | 'finished'
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface TournamentListResponse {
  items: Tournament[]
  total: number
  page: number
  page_size: number
}

export interface CreateTournamentData {
  name: string
  sport_type: string
  bracket_type: string
  description?: string
  max_participants: number
  start_date: string
  end_date: string
  is_visible: boolean
}

export interface UpdateTournamentData {
  name?: string
  sport_type?: string
  bracket_type?: string
  description?: string
  max_participants?: number
  start_date?: string
  end_date?: string
  is_visible?: boolean
  status?: string
}

export async function createTournament(data: CreateTournamentData): Promise<Tournament> {
  const res = await client.post<Tournament>('/tournaments', data)
  return res.data
}

export async function updateTournament(id: string, data: UpdateTournamentData): Promise<Tournament> {
  const res = await client.patch<Tournament>(`/tournaments/${id}`, data)
  return res.data
}

export async function getTournament(id: string): Promise<Tournament> {
  const res = await client.get<Tournament>(`/tournaments/${id}`)
  return res.data
}

export async function listTournaments(params?: { search?: string; page?: number; page_size?: number }): Promise<TournamentListResponse> {
  const res = await client.get<TournamentListResponse>('/tournaments', { params })
  return res.data
}

export async function getHostedTournaments(): Promise<Tournament[]> {
  const res = await client.get<Tournament[]>('/tournaments/hosted')
  return res.data
}

export async function deleteTournament(id: string): Promise<void> {
  await client.delete(`/tournaments/${id}`)
}

export async function publishTournament(id: string): Promise<Tournament> {
  const res = await client.post<Tournament>(`/tournaments/${id}/publish`)
  return res.data
}

export async function closeTournament(id: string): Promise<Tournament> {
  const res = await client.post<Tournament>(`/tournaments/${id}/close`)
  return res.data
}

export async function startTournament(id: string): Promise<Tournament> {
  const res = await client.post<Tournament>(`/tournaments/${id}/start`)
  return res.data
}
