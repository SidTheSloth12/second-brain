import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, attachAuthHeader, getStoredToken, setStoredToken } from '../lib/api'
import { AuthContext, type User } from './auth-context'

type AuthResponse = {
  token: string
  user: User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = getStoredToken()
    attachAuthHeader(t)
    setToken(t)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const t = getStoredToken()
      if (!t) {
        if (!cancelled) setReady(true)
        return
      }
      attachAuthHeader(t)
      try {
        const { data } = await api.get<{ user: User }>('/api/auth/me')
        if (!cancelled) setUser(data.user)
      } catch {
        setStoredToken(null)
        attachAuthHeader(null)
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
    setStoredToken(data.token)
    attachAuthHeader(data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { email, password })
    setStoredToken(data.token)
    attachAuthHeader(data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    attachAuthHeader(null)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
    }),
    [user, token, ready, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
