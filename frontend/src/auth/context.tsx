import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { storeToken, removeToken, getToken, getUserId, getUserEmail } from './storage'

interface User {
  user_id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, region?: string, fieldOfStudy?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const userId = getUserId()
    const email = getUserEmail()
    if (token && userId && email) {
      setUser({ user_id: userId, email })
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password })
    const { access_token, user_id } = response.data
    storeToken(access_token, user_id, email)
    setUser({ user_id, email })
  }, [])

  const register = useCallback(async (email: string, password: string, region?: string, fieldOfStudy?: string) => {
    const response = await api.register({ email, password, region, field_of_study: fieldOfStudy })
    const { access_token, user_id } = response.data
    storeToken(access_token, user_id, email)
    setUser({ user_id, email })
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
