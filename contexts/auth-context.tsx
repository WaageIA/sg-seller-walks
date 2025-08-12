"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabaseAuth, isDemoAuth } from "@/lib/supabase-auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoAuth) {
      // Ambiente de preview - cria um usuário fictício para não falhar
      setUser({ id: "demo-user", email: "demo@preview.dev" } as any)
      setLoading(false)
      return
    }

    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoAuth) {
        // Faz login instantâneo no modo preview
        setUser({ id: "demo-user", email } as any)
        const { AuditLogger } = await import("@/lib/audit-logger")
        await AuditLogger.logAuthAttempt(email, true)
        return
      }
      
      const { error } = await supabaseAuth.auth.signInWithPassword({ email, password })
      
      if (error) {
        const { AuditLogger } = await import("@/lib/audit-logger")
        await AuditLogger.logAuthAttempt(email, false)
        throw error
      }
      
      const { AuditLogger } = await import("@/lib/audit-logger")
      await AuditLogger.logAuthAttempt(email, true)
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    if (isDemoAuth) {
      setUser(null)
      return
    }
    const { error } = await supabaseAuth.auth.signOut()
    if (error) throw error
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
