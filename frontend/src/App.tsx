import { useEffect } from 'react'
import AppRoutes from './routes'
import { useAuthStore } from './store/authStore'
import { getMe } from './api/auth'

export default function App() {
  const { token, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    if (token) {
      getMe()
        .then((user) => {
          setAuth(token, user)
        })
        .catch(() => {
          clearAuth()
        })
    }
  }, [])

  return <AppRoutes />
}
