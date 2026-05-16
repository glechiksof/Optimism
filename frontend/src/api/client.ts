import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import {
  initMockData,
  mockRegister, mockLogin, mockGetMe, mockUpdateMe,
  mockCreateTournament, mockUpdateTournament, mockListTournaments,
  mockGetHostedTournaments, mockGetTournament,
  mockCreateTeam, mockGetTeam, mockListTeams, mockJoinTeam,
  mockJoinTournament, mockListParticipants, mockParticipationStatus,
  mockGenerateMatches, mockListMatches,
  mockTransition, mockLeaveTournament, mockRemoveParticipant,
  mockLeaveTeam, mockRemoveMember,
  mockGenerateToken, mockGetTokens, mockRevokeToken,
  mockJoinedTournaments, mockMyStats, mockStandings,
  mockUpdateTeam, mockDeleteTeam, mockDeleteTournament, mockSubmitMatchResult,
  mockAddTeamToTournament,
} from './mock'

const USE_MOCK = import.meta.env.VITE_API_BASE_URL === 'mock'

if (USE_MOCK) {
  initMockData()
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
}) as AxiosInstance & { isMock?: boolean }

client.isMock = USE_MOCK

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const { state } = JSON.parse(raw) as { state: { token: string | null } }
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config
})

if (USE_MOCK) {
  const mockAdapter = (config: InternalAxiosRequestConfig) => {
    const url = config.url || ''
    const method = config.method || 'get'
    const authHeader = config.headers?.Authorization
    const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : ''
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {})

    if (method === 'post' && url.includes('/auth/register')) {
      return mockRegister(body).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.includes('/auth/login')) {
      return mockLogin(body).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url.includes('/users/me')) {
      return mockGetMe(token).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'patch' && url.includes('/users/me')) {
      return mockUpdateMe(token, body).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url === '/tournaments') {
      return mockCreateTournament(token, body).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'patch' && url.match(/^\/tournaments\/[^/]+$/)) {
      const id = url.split('/').pop()!
      return mockUpdateTournament(token, id, body).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url === '/tournaments/hosted') {
      return mockGetHostedTournaments(token).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url === '/tournaments') {
      const search = config.params?.search
      const type = config.params?.type
      return mockListTournaments(search, type).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+$/)) {
      const id = url.split('/').pop()!
      return mockGetTournament(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url === '/teams') {
      return mockCreateTeam(token, body).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'get' && url === '/teams') {
      return mockListTeams(config.params).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/teams\/[^/]+\/join$/)) {
      const id = url.split('/')[2]
      return mockJoinTeam(token, id, body?.token ?? null).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/teams\/[^/]+$/) && !url.includes('/tokens')) {
      const id = url.split('/').pop()!
      return mockGetTeam(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/join$/)) {
      const id = url.split('/')[2]
      return mockJoinTournament(token, id, body).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/teams$/)) {
      const id = url.split('/')[2]
      return mockAddTeamToTournament(token, id, body.team_id).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+\/participants$/)) {
      const id = url.split('/')[2]
      return mockListParticipants(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+\/status$/)) {
      const id = url.split('/')[2]
      return mockParticipationStatus(token, id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/generate$/)) {
      const id = url.split('/')[2]
      return mockGenerateMatches(token, id).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+\/matches$/)) {
      const id = url.split('/')[2]
      return mockListMatches(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+\/standings$/)) {
      const id = url.split('/')[2]
      return mockStandings(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/publish$/)) {
      const id = url.split('/')[2]
      return mockTransition(token, id, 'publish').then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/close$/)) {
      const id = url.split('/')[2]
      return mockTransition(token, id, 'close').then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/tournaments\/[^/]+\/start$/)) {
      const id = url.split('/')[2]
      return mockTransition(token, id, 'start').then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/tournaments\/[^/]+\/leave$/)) {
      const id = url.split('/')[2]
      return mockLeaveTournament(token, id).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/tournaments\/[^/]+\/participants\/[^/]+$/)) {
      const parts = url.split('/')
      return mockRemoveParticipant(token, parts[2], parts[4]).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/teams\/[^/]+\/leave$/)) {
      const id = url.split('/')[2]
      return mockLeaveTeam(token, id).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/teams\/[^/]+\/members\/[^/]+$/)) {
      const parts = url.split('/')
      return mockRemoveMember(token, parts[2], parts[4]).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'post' && url.match(/^\/teams\/[^/]+\/tokens$/)) {
      const id = url.split('/')[2]
      return mockGenerateToken(token, id).then((data) => ({ data, status: 201, statusText: 'Created', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/teams\/[^/]+\/tokens$/)) {
      const id = url.split('/')[2]
      return mockGetTokens(token, id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/teams\/[^/]+\/tokens\/[^/]+$/)) {
      const parts = url.split('/')
      return mockRevokeToken(token, parts[2], parts[4]).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'get' && url === '/users/me/joined-tournaments') {
      return mockJoinedTournaments(token).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url === '/users/me/stats') {
      return mockMyStats(token).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'patch' && url.match(/^\/teams\/[^/]+$/) && !url.includes('/tokens')) {
      const id = url.split('/').pop()!
      return mockUpdateTeam(token, id, body).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/teams\/[^/]+$/) && !url.includes('/tokens') && !url.includes('/leave') && !url.includes('/members')) {
      const id = url.split('/').pop()!
      return mockDeleteTeam(token, id).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'delete' && url.match(/^\/tournaments\/[^/]+$/) && !url.includes('/leave') && !url.includes('/participants')) {
      const id = url.split('/').pop()!
      return mockDeleteTournament(token, id).then(() => ({ data: null, status: 204, statusText: 'No Content', headers: {}, config }))
    }

    if (method === 'patch' && url.match(/^\/tournaments\/[^/]+\/matches\/[^/]+\/result$/)) {
      const parts = url.split('/')
      return mockSubmitMatchResult(token, parts[2], parts[4], body.winner_participant_id)
        .then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    return Promise.reject(new Error('Unknown mock endpoint'))
  }

  // Axios's adapter type expects a richer Promise<AxiosResponse> than our
  // partial mock returns; the runtime contract is satisfied so we suppress
  // the structural mismatch here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.defaults.adapter = mockAdapter as any
}

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
