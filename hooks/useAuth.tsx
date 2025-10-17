'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import toast from 'react-hot-toast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'tutor' | 'student'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
        },
      })

      if (error) throw error

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Account created! Please check your email and click the confirmation link.')
      } else {
        toast.success('Welcome to Classroomly! Account created successfully!')
      }
      
      return { data, error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email)
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log('🔐 Sign in response:', { data: !!data, error: error?.message })

      if (error) {
        console.error('🔐 Sign in error:', error)
        
        // Handle specific error cases
        if (error.message?.includes('Email not confirmed')) {
          throw new Error('EMAIL_NOT_CONFIRMED')
        }
        
        // Handle 400 Bad Request specifically
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        }
        
        throw error
      }

      console.log('🔐 Sign in successful for:', data.user?.email)
      toast.success('Signed in successfully!')
      return { data, error: null }
    } catch (error: any) {
      console.error('🔐 Sign in catch block:', error)
      
      if (error.message === 'EMAIL_NOT_CONFIRMED') {
        // Don't show toast here, let the login page handle it
        return { data: null, error: { message: 'EMAIL_NOT_CONFIRMED', email } }
      }
      
      toast.error(error.message || 'Failed to sign in')
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('Signed out successfully!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) throw error

      toast.success('Confirmation email sent! Please check your inbox.')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send confirmation email')
      return { error }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as Record<string, any>)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('Profile updated successfully!')
      return { data, error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resendConfirmation,
    isAuthenticated: !!user,
  }
}

