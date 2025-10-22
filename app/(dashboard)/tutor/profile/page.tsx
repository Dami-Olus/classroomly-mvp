'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Globe, Briefcase, BookOpen, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Tutor } from '@/types'
import ProfileImageUpload from '@/components/ProfileImageUpload'

export default function TutorProfile() {
  const { profile, updateProfile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    timezone: profile?.timezone || 'UTC',
    bio: '',
    expertise: [] as string[],
    education: '',
    experience: '',
    hourly_rate: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        timezone: profile.timezone || 'UTC',
      }))
      loadTutorProfile()
    }
  }, [profile])

  const loadTutorProfile = async () => {
    if (!profile) return

    console.log('Loading tutor profile for user:', profile.id)

    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    if (data) {
      console.log('Loaded tutor profile:', data)
      setTutorProfile(data)
      setFormData((prev) => ({
        ...prev,
        bio: data.bio || '',
        expertise: data.expertise || [],
        education: data.education || '',
        experience: data.experience || '',
        hourly_rate: data.hourly_rate?.toString() || '',
      }))
    } else if (error && error.code === 'PGRST116') {
      console.log('No tutor profile found, creating new one')
      // Create tutor profile if it doesn't exist
      const { data: newTutor } = await supabase
        .from('tutors')
        .insert({ user_id: profile.id, expertise: [] })
        .select()
        .single()

      if (newTutor) {
        console.log('Created new tutor profile:', newTutor)
        setTutorProfile(newTutor)
      }
    } else if (error) {
      console.error('Error loading tutor profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Updating profile with data:', formData)
      
      // Update profile
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        timezone: formData.timezone,
      })

      // Update tutor profile
      if (profile) {
        console.log('Updating tutor profile with expertise:', formData.expertise)
        
        const { data, error } = await supabase
          .from('tutors')
          .update({
            bio: formData.bio,
            expertise: formData.expertise,
            education: formData.education,
            experience: formData.experience,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          })
          .eq('user_id', profile.id)
          .select()

        if (error) {
          console.error('Error updating tutor profile:', error)
          throw error
        }
        
        console.log('Tutor profile updated successfully:', data)
        toast.success('Profile updated successfully!')
        
        // Reload the profile to ensure UI is updated
        await loadTutorProfile()
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const addExpertise = (expertise: string) => {
    if (expertise && !formData.expertise.includes(expertise)) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertise],
      })
    }
  }

  const removeExpertise = (expertise: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter((e) => e !== expertise),
    })
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Tutor Profile
            </h1>
            <p className="text-secondary-600">
              Manage your profile information and expertise
            </p>
          </div>

          <div className="max-w-3xl">
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

              {/* Professional Information */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  <Briefcase className="w-5 h-5 inline-block mr-2" />
                  Professional Information
                </h2>

                <div>
                  <label htmlFor="bio" className="label">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="input"
                    rows={4}
                    placeholder="Tell students about yourself..."
                  />
                </div>

                <div className="mt-4">
                  <label className="label">
                    <BookOpen className="w-4 h-4 inline-block mr-2" />
                    Expertise (Subjects you teach)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="expertise"
                      className="input"
                      placeholder="e.g. Mathematics, Physics..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          addExpertise(input.value)
                          input.value = ''
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {exp}
                        <button
                          type="button"
                          onClick={() => removeExpertise(exp)}
                          className="text-primary-700 hover:text-primary-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="education" className="label">
                    Education
                  </label>
                  <textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    className="input"
                    rows={3}
                    placeholder="Your educational background..."
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="experience" className="label">
                    Experience
                  </label>
                  <textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="input"
                    rows={3}
                    placeholder="Your teaching experience..."
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="hourly_rate" className="label">
                    <DollarSign className="w-4 h-4 inline-block mr-2" />
                    Hourly Rate (USD)
                  </label>
                  <input
                    type="number"
                    id="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourly_rate: e.target.value })
                    }
                    className="input"
                    placeholder="50"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

