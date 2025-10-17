'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {}

      // Get current URL info
      info.currentUrl = window.location.href
      info.hash = window.location.hash
      info.search = window.location.search
      info.pathname = window.location.pathname

      // Parse hash parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      info.hashParams = Object.fromEntries(hashParams.entries())

      // Parse search parameters
      const searchParams = new URLSearchParams(window.location.search)
      info.searchParams = Object.fromEntries(searchParams.entries())

      // Get Supabase session
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      info.session = session
      info.sessionError = sessionError

      // Get user info
      const { data: user, error: userError } = await supabase.auth.getUser()
      info.user = user
      info.userError = userError

      setDebugInfo(info)
    }

    gatherDebugInfo()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">URL Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Current URL:</strong> {debugInfo.currentUrl}</div>
            <div><strong>Hash:</strong> {debugInfo.hash}</div>
            <div><strong>Search:</strong> {debugInfo.search}</div>
            <div><strong>Pathname:</strong> {debugInfo.pathname}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Hash Parameters</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.hashParams, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Search Parameters</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.searchParams, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Supabase Session</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.session, null, 2)}
          </pre>
          {debugInfo.sessionError && (
            <div className="mt-2 text-red-600">
              <strong>Session Error:</strong> {JSON.stringify(debugInfo.sessionError, null, 2)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
          {debugInfo.userError && (
            <div className="mt-2 text-red-600">
              <strong>User Error:</strong> {JSON.stringify(debugInfo.userError, null, 2)}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/auth/callback" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Callback Page
          </a>
        </div>
      </div>
    </div>
  )
}
