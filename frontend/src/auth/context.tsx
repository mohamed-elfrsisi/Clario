import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { storeToken, removeToken, getToken, getUserId, getUserEmail } from './storage'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<import('./AuthContext').User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const userId = getUserId()
    const email = getUserEmail()
    if (token && userId && email) setUser({ user_id: userId, email })
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
