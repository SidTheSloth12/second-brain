import { createContext } from 'react'

export type User = {
  id: string
  email: string
  createdAt: string
}

export type AuthState = {
  user: User | null
  token: string | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
