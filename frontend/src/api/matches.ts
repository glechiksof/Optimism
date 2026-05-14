import client from './client'

export interface MatchParticipantInfo {
  id: string
  user_id?: string
  team_id?: string
  manual_name?: string
  username?: string
}

export interface Match {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  participant_a: MatchParticipantInfo | null
  participant_b: MatchParticipantInfo | null
  winner_id: string | null
  status: 'pending' | 'completed'
  scheduled_at: string | null
}

export interface MatchListResponse {
  items: Match[]
  total: number
}

export async function generateMatches(tournamentId: string): Promise<MatchListResponse> {
  const res = await client.post<MatchListResponse>(`/tournaments/${tournamentId}/generate`)
  return res.data
}

export async function listMatches(tournamentId: string): Promise<MatchListResponse> {
  const res = await client.get<MatchListResponse>(`/tournaments/${tournamentId}/matches`)
  return res.data
}

export async function submitMatchResult(
  tournamentId: string,
  matchId: string,
  winnerParticipantId: string,
): Promise<Match> {
  const res = await client.patch<Match>(
    `/tournaments/${tournamentId}/matches/${matchId}/result`,
    { winner_participant_id: winnerParticipantId },
  )
  return res.data
}
