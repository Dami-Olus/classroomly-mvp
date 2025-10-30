'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Suspense } from 'react'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Processing auth callback...')
        
        // Get the URL hash parameters that Supabase sends
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('🔐 Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, error, errorDescription })

        if (error) {
          console.error('🔐 Auth error:', error, errorDescription)
          setStatus('error')
          setMessage(`Authentication failed: ${errorDescription || error}`)
          return
        }

        if (accessToken && refreshToken) {
          console.log('🔐 Setting session with tokens from URL...')
          // Set the session with the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('🔐 Session error:', sessionError)
            setStatus('error')
            setMessage(`Session error: ${sessionError.message}`)
            return
          }

          if (data.session?.user) {
            console.log('🔐 User authenticated successfully:', data.session.user.email)
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting...')
            
            // Redirect to appropriate dashboard based on user role
            setTimeout(() => {
              // Get user metadata to determine role
              const userRole = data.session?.user?.user_metadata?.role
              if (userRole === 'admin') {
                router.push('/admin/dashboard')
              } else if (userRole === 'tutor') {
                router.push('/tutor/dashboard')
              } else {
                router.push('/student/dashboard')
              }
            }, 2000)
          } else {
            console.error('🔐 No user in session')
            setStatus('error')
            setMessage('No user found in session')
          }
        } else {
          console.log('🔐 No tokens in URL, checking existing session...')
          // No tokens in URL, check if user is already authenticated
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('🔐 Session check error:', sessionError)
            setStatus('error')
            setMessage(`Session error: ${sessionError.message}`)
            return
          }

          if (data.session?.user) {
            console.log('🔐 User already authenticated:', data.session.user.email)
            setStatus('success')
            setMessage('Already authenticated! Redirecting...')
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
              const userRole = data.session?.user?.user_metadata?.role
              if (userRole === 'tutor') {
                router.push('/tutor/dashboard')
              } else {
                router.push('/student/dashboard')
              }
            }, 2000)
          } else {
            console.error('🔐 No existing session found')
            setStatus('error')
            setMessage('No authentication session found. Please try signing in again.')
          }
        }
      } catch (error: any) {
        console.error('🔐 Unexpected error in auth callback:', error)
        setStatus('error')
        setMessage(`Unexpected error: ${error.message}`)
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Confirming Email...
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
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Confirmation Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary"
                >
                  Go to Login
                </button>
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