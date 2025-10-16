'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTimezone } from '@/hooks/useTimezone'
import { Calendar, Clock, Save, Globe, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import AvailabilitySelector from '@/components/AvailabilitySelector'
import { TimezoneSelector } from '@/components/TimezoneSelector'
import { DualTimeDisplay, TimezoneInfoDisplay } from '@/components/DualTimeDisplay'
import type { TimeRange } from '@/lib/availability'

export default function AvailabilityPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { timezone, timezoneInfo, updateTimezone, loading: timezoneLoading } = useTimezone()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeRange[]>([])
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [showTimezonePreview, setShowTimezonePreview] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [profile])

  const loadAvailability = async () => {
    if (!profile) return

    try {
      const { data: tutorData, error } = await supabase
        .from('tutors')
        .select('id, availability')
        .eq('user_id', profile.id)
        .single()

      if (error) throw error

      if (tutorData) {
        setTutorId(tutorData.id)
        const slots = (tutorData.availability as any)?.slots || []
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!tutorId) {
      toast.error('Tutor profile not found')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          availability: { slots: availableSlots },
        })
        .eq('id', tutorId)

      if (error) throw error

      toast.success('Availability updated successfully!')
      
      // Optional: redirect to classes
      // router.push('/tutor/classes')
    } catch (error: any) {
      console.error('Error saving availability:', error)
      toast.error(error.message || 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading availability...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              My Availability
            </h1>
            <p className="text-secondary-600">
              Set your general weekly availability. This will apply to all your classes.
            </p>
          </div>

          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold">Weekly Schedule</h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>💡 How it works:</strong> Set your general availability here once. 
                When students book your classes, they'll see these time slots. You can always 
                adjust your availability, and it will update for all your classes.
              </p>
            </div>

            <AvailabilitySelector
              availableSlots={availableSlots}
              onChange={setAvailableSlots}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || availableSlots.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>

          {/* Timezone Management */}
          <div className="card bg-blue-50 border-blue-200 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Timezone Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Timezone
                </label>
                <TimezoneSelector
                  value={timezone}
                  onChange={updateTimezone}
                  disabled={timezoneLoading}
                  className="w-full"
                />
                {timezoneInfo && (
                  <div className="mt-2 text-sm text-gray-600">
                    <TimezoneInfoDisplay timezone={timezone} showDetails={true} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTimezonePreview(!showTimezonePreview)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  {showTimezonePreview ? 'Hide' : 'Show'} timezone preview
                </button>
              </div>

              {showTimezonePreview && availableSlots.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-3">How your availability appears to students:</h4>
                  <div className="space-y-2">
                    {availableSlots.slice(0, 3).map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{slot.day}</span>
                        <DualTimeDisplay
                          time={`${slot.startTime} - ${slot.endTime}`}
                          fromTz={timezone}
                          toTz="America/New_York"
                          showLabels={true}
                          compact={true}
                        />
                      </div>
                    ))}
                    {availableSlots.length > 3 && (
                      <p className="text-sm text-gray-500">... and {availableSlots.length - 3} more slots</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="card bg-secondary-50">
              <Clock className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-secondary-900 mb-2">
                Automatic Conversion
              </h3>
              <p className="text-sm text-secondary-600">
                Students will see your availability times converted to their local timezone automatically. 
                No manual calculation needed!
              </p>
            </div>

            <div className="card bg-secondary-50">
              <Calendar className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-secondary-900 mb-2">
                Applies to All Classes
              </h3>
              <p className="text-sm text-secondary-600">
                This availability schedule will be used for all your classes. 
                Students can book any of these time slots for any of your classes.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

