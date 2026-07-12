import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'
import { AUTH_STORAGE_KEY } from '../constants/roles'

const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredAuth()?.token ?? null)
  const [user, setUser] = useState(() => readStoredAuth()?.user ?? null)
  const [loading, setLoading] = useState(true)

  const persistAuth = useCallback((nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser }),
    )
  }, [])

  const clearAuth = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const response = await authApi.login(credentials)
      const token = response.token
      const user = response.user
      persistAuth(token, user)
      return user
    },
    [persistAuth],
  )

  const signup = useCallback(
    async (name, email, password, role) => {
      const data = await authApi.signup(name, email, password, role)
      persistAuth(data.token, data.user)
      return data.user
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authApi.getMe(token)
        setUser(response.user)
      } catch {
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [token, clearAuth])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
    }),
    [token, user, loading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
