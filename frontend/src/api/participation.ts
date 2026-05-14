import client from './client'

export interface Participant {
  id: string
  tournament_id: string
  user_id?: string
  team_id?: string
  manual_name?: string
  registered_at: string
}

export interface ParticipantListResponse {
  items: Participant[]
  total: number
}

export interface ParticipationStatus {
  is_participant: boolean
  participant_id: string | null
}

export async function joinTournament(id: string, teamId?: string): Promise<Participant> {
  const res = await client.post<Participant>(`/tournaments/${id}/join`, { team_id: teamId ?? null })
  return res.data
}

export async function listParticipants(id: string): Promise<ParticipantListResponse> {
  const res = await client.get<ParticipantListResponse>(`/tournaments/${id}/participants`)
  return res.data
}

export async function getParticipationStatus(id: string): Promise<ParticipationStatus> {
  const res = await client.get<ParticipationStatus>(`/tournaments/${id}/status`)
  return res.data
}
