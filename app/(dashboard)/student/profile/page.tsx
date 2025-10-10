'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { User, Mail, Globe } from 'lucide-react'
import ProfileImageUpload from '@/components/ProfileImageUpload'

export default function StudentProfile() {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    timezone: profile?.timezone || 'UTC',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        timezone: profile.timezone || 'UTC',
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await updateProfile({
      first_name: formData.first_name,
      last_name: formData.last_name,
      timezone: formData.timezone,
    })

    setLoading(false)
  }

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Student Profile
            </h1>
            <p className="text-secondary-600">
              Manage your profile information
            </p>
          </div>

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Profile Image</h2>
                <ProfileImageUpload />
              </div>

              {/* Basic Information */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="label">
                      <User className="w-4 h-4 inline-block mr-2" />
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="email" className="label">
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    className="input bg-secondary-100"
                    disabled
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div className="mt-4">
                  <label htmlFor="timezone" className="label">
                    <Globe className="w-4 h-4 inline-block mr-2" />
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    className="input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

