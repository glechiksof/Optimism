import client from './client'

export interface Participant {
  id: string
  tournament_id: string
  user_id?: string
  team_id?: string
  manual_name?: string
  username?: string
  team_name?: string
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

export async function addTeamToTournament(id: string, teamId: string): Promise<Participant> {
  const res = await client.post<Participant>(`/tournaments/${id}/teams`, { team_id: teamId })
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

export async function leaveTournament(id: string): Promise<void> {
  await client.delete(`/tournaments/${id}/leave`)
}

export async function removeParticipant(tournamentId: string, participantId: string): Promise<void> {
  await client.delete(`/tournaments/${tournamentId}/participants/${participantId}`)
}

// Tournaments the current user is registered for (full Tournament objects).
import type { Tournament } from './tournaments'
export async function getJoinedTournaments(): Promise<Tournament[]> {
  const res = await client.get<Tournament[]>('/users/me/joined-tournaments')
  return res.data
}
