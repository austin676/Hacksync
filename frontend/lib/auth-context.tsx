"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (walletAddress: string, signature: string) => Promise<void>
  logout: () => void
  requestChallenge: (walletAddress: string) => Promise<{ message: string; nonce: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    if (storedToken) {
      verifyStoredToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyStoredToken = async (storedToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(storedToken)
      } else {
        localStorage.removeItem("auth_token")
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      localStorage.removeItem("auth_token")
    } finally {
      setIsLoading(false)
    }
  }

  const requestChallenge = useCallback(async (walletAddress: string) => {
    const response = await fetch("/api/auth/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get challenge")
    }

    return response.json()
  }, [])

  const login = useCallback(async (walletAddress: string, signature: string) => {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, signature }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Authentication failed")
    }

    const data = await response.json()
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem("auth_token", data.token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("auth_token")
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        requestChallenge,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
