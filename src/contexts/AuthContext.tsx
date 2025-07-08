import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, User } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    name: string,
    accountType?: 'customer' | 'service_provider',
    providerFields?: {
      business: string
      type: string
      contact_email: string
      contact_phone: string
      description: string
    }
  ) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.debug('fetchUserProfile: start', { userId })
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.debug('fetchUserProfile: error', error)
        // If user doesn't exist, create them
        if (error.code === 'PGRST116') {
          console.debug('fetchUserProfile: user not found, creating profile')
          await createUserProfile(userId)
          return
        }
        throw error
      }
      console.debug('fetchUserProfile: got user', data)
      setUser(data)
    } catch (error) {
      console.debug('fetchUserProfile: catch error', error)
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
      console.debug('fetchUserProfile: done')
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || '',
          role: 'customer'
        })
        .select()
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.debug('signIn: start', { email })
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      console.debug('signIn: error', error)
      throw error
    }
    console.debug('signIn: success')
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    accountType: 'customer' | 'service_provider' = 'customer',
    providerFields?: {
      business: string
      type: string
      contact_email: string
      contact_phone: string
      description: string
    }
  ) => {
    // Set role in metadata
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: accountType
        }
      }
    })
    if (error) throw error

    // If service provider, create service_providers row
    if (accountType === 'service_provider' && data.user) {
      const { user } = data
      const { error: spError } = await supabase
        .from('service_providers')
        .insert({
          user_id: user.id,
          type: providerFields?.type || 'other',
          name: providerFields?.business || name,
          contact_email: providerFields?.contact_email || email,
          contact_phone: providerFields?.contact_phone || '',
          description: providerFields?.description || ''
        })
      if (spError) throw spError
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setUser(data)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}