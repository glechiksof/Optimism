import axios, { AxiosInstance } from 'axios'
import {
  initMockData,
  mockRegister, mockLogin, mockGetMe, mockUpdateMe,
  mockCreateTournament, mockUpdateTournament, mockListTournaments,
  mockGetHostedTournaments, mockGetTournament,
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
  const mockAdapter = (config: any) => {
    const url = config.url || ''
    const method = config.method || 'get'
    const token = config.headers?.Authorization?.replace('Bearer ', '') || ''
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
      return mockListTournaments(search).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    if (method === 'get' && url.match(/^\/tournaments\/[^/]+$/)) {
      const id = url.split('/').pop()!
      return mockGetTournament(id).then((data) => ({ data, status: 200, statusText: 'OK', headers: {}, config }))
    }

    return Promise.reject(new Error('Unknown mock endpoint'))
  }

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
