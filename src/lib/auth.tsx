import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '#/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ============================================
// Types
// ============================================
export type AppRole = 'owner' | 'cashier'

export interface UserRole {
  id: string
  user_id: string
  shop_id: string
  role: AppRole
}

export interface Shop {
  id: string
  name: string
  address: string | null
  phone: string | null
  currency: string
}

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  shop: Shop | null
  isLoading: boolean
  isAuthenticated: boolean
  isOwner: boolean
  isCashier: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsSetup: boolean }>
  signOut: () => Promise<void>
  createShop: (name: string, address: string, phone: string) => Promise<{ error: string | null }>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// ============================================
// Provider
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user role and shop data
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (roleData) {
        setUserRole(roleData)

        // Get shop
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('id', roleData.shop_id)
          .single()

        if (shopData) {
          setShop(shopData)
        }
      } else {
        setUserRole(null)
        setShop(null)
      }
    } catch {
      setUserRole(null)
      setShop(null)
    }
  }, [])

  // Initialize auth state — client only
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchUserData(session.user.id)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchUserData(session.user.id)
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserRole(null)
          setShop(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserData])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Supabase returns generic "Invalid login credentials" for unconfirmed emails too.
      // Check if the user exists but email is unconfirmed.
      if (error.message === 'Invalid login credentials' || error.message === 'Email not confirmed') {
        return { error: 'Invalid login credentials. If you just signed up, please check your email and confirm your account first, or ask the admin to disable email confirmation in Supabase settings.' }
      }
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // If email confirmation is disabled in Supabase, this has no effect.
        // If enabled, redirect to login page after confirmation.
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : undefined,
      },
    })
    if (error) return { error: error.message, needsSetup: false }

    // Check if user was auto-confirmed (email confirmation disabled in Supabase)
    // vs needs email confirmation
    if (data.user && data.session) {
      // Auto-confirmed — user has a session, proceed to setup
      setUser(data.user)
      return { error: null, needsSetup: true }
    } else if (data.user && !data.session) {
      // Email confirmation required — user was created but no session
      return {
        error: 'Account created! Please check your email to confirm your account before signing in.',
        needsSetup: false,
      }
    }
    return { error: 'Signup failed', needsSetup: false }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setShop(null)
  }, [])

  const createShop = useCallback(async (name: string, address: string, phone: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      // Use the SECURITY DEFINER function to create shop + owner role atomically
      const { error: rpcError } = await supabase
        .rpc('create_shop_with_owner', {
          _name: name,
          _address: address || null,
          _phone: phone || null,
        })

      if (rpcError) return { error: rpcError.message }

      // Refresh data
      await fetchUserData(user.id)
      return { error: null }
    } catch {
      return { error: 'Failed to create shop' }
    }
  }, [user, fetchUserData])

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id)
    }
  }, [user, fetchUserData])

  const value: AuthContextType = {
    user,
    userRole,
    shop,
    isLoading,
    isAuthenticated: !!user && !!userRole && !!shop,
    isOwner: userRole?.role === 'owner',
    isCashier: userRole?.role === 'cashier',
    signIn,
    signUp,
    signOut,
    createShop,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
