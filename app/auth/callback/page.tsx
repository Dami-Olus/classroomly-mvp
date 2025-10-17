'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { profile } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters that Supabase sends
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('Auth callback params:', { accessToken, refreshToken, error, errorDescription })

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(`Failed to confirm your email: ${errorDescription || error}`)
          return
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('Failed to establish session. Please try again.')
            return
          }

          if (data.session?.user) {
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to your dashboard...')
            
            // Wait a moment then redirect based on user role
            setTimeout(() => {
              if (profile?.role === 'tutor') {
                router.push('/tutor/dashboard')
              } else {
                router.push('/student/dashboard')
              }
            }, 2000)
          } else {
            setStatus('error')
            setMessage('No active session found. Please try signing in again.')
          }
        } else {
          // No tokens in URL, check if user is already authenticated
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('Failed to confirm your email. Please try again.')
            return
          }

          if (data.session?.user) {
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to your dashboard...')
            
            setTimeout(() => {
              if (profile?.role === 'tutor') {
                router.push('/tutor/dashboard')
              } else {
                router.push('/student/dashboard')
              }
            }, 2000)
          } else {
            setStatus('error')
            setMessage('No active session found. Please try signing in again.')
          }
        }
      } catch (error) {
        console.error('Callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router, supabase, profile])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Confirming your email...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Email Confirmed!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Continue to Login
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Confirmation Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try Signing In
                </Link>
                <Link
                  href="/signup"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Loading...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we process your request.
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
