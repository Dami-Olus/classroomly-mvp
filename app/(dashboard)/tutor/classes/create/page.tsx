'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { BookOpen, Clock, Calendar, DollarSign, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateBookingLink } from '@/lib/utils'
import { formatTimeRange, generateTimeSlotsFromRanges } from '@/lib/availability'
import type { TimeRange } from '@/lib/availability'

export default function CreateClassPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    weeklyFrequency: 1,
    pricePerSession: '',
    maxStudents: 1,
  })

  const [tutorAvailability, setTutorAvailability] = useState<TimeRange[]>([])

  useEffect(() => {
    loadTutorAvailability()
  }, [profile])

  const loadTutorAvailability = async () => {
    if (!profile) return

    try {
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('availability')
        .eq('user_id', profile.id)
        .single()

      if (tutorData?.availability) {
        const slots = (tutorData.availability as any)?.slots || []
        setTutorAvailability(slots)
      }
    } catch (error) {
      console.error('Error loading tutor availability:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (tutorAvailability.length === 0) {
      toast.error('Please set your availability first')
      router.push('/tutor/availability')
      return
    }

    setLoading(true)

    try {
      // Get tutor profile
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      if (!tutorData) {
        throw new Error('Tutor profile not found')
      }

      // Generate unique booking link
      const bookingLink = generateBookingLink()

      // Generate specific time slots from tutor's availability ranges
      const specificSlots = generateTimeSlotsFromRanges(
        tutorAvailability,
        formData.duration
      )

      // Create class (with generated slots)
      const { data: classData, error } = await supabase
        .from('classes')
        .insert({
          tutor_id: tutorData.id,
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          duration: formData.duration,
          weekly_frequency: formData.weeklyFrequency,
          price_per_session: formData.pricePerSession
            ? parseFloat(formData.pricePerSession)
            : null,
          available_slots: specificSlots, // Generated slots from ranges
          booking_link: bookingLink,
          max_students: formData.maxStudents,
        })
        .select()
        .single()

      if (error) throw error

      const bookingUrl = `${window.location.origin}/book/${bookingLink}`
      setGeneratedLink(bookingUrl)

      toast.success('Class created successfully!')
      
      // Don't redirect immediately, let them copy the link first
    } catch (error: any) {
      console.error('Error creating class:', error)
      toast.error(error.message || 'Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const goToClasses = () => {
    router.push('/tutor/classes')
  }

  // If link is generated, show success screen
  if (generatedLink) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="max-w-2xl mx-auto">
            <div className="card bg-green-50 border-green-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-green-900 mb-2">
                  Class Created Successfully! 🎉
                </h1>
                <p className="text-green-700 mb-6">
                  Share this link with students to start receiving bookings
                </p>

                <div className="bg-white rounded-lg p-4 mb-6">
                  <p className="text-sm text-secondary-600 mb-2">
                    Your shareable booking link:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="input flex-1 font-mono text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="btn-primary flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setGeneratedLink('')}
                    className="btn-secondary"
                  >
                    Create Another Class
                  </button>
                  <button onClick={goToClasses} className="btn-primary">
                    View All My Classes
                  </button>
                </div>
              </div>
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
              Create New Class
            </h1>
            <p className="text-secondary-600">
              Set up a new tutoring class and get a shareable booking link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                Class Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="label">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. Advanced Calculus Tutoring"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="label">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. Mathematics, Physics, English"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input"
                    rows={4}
                    placeholder="Describe what students will learn, prerequisites, etc."
                  />
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Session Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="label">
                    Duration per Session *
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="input"
                    required
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="weeklyFrequency" className="label">
                    Sessions per Week *
                  </label>
                  <select
                    id="weeklyFrequency"
                    value={formData.weeklyFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weeklyFrequency: parseInt(e.target.value),
                      })
                    }
                    className="input"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'session' : 'sessions'} per week
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pricePerSession" className="label">
                    <DollarSign className="w-4 h-4 inline-block mr-1" />
                    Price per Session (USD)
                  </label>
                  <input
                    type="number"
                    id="pricePerSession"
                    value={formData.pricePerSession}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerSession: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="50.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Leave empty if price varies or to be discussed
                  </p>
                </div>

                <div>
                  <label htmlFor="maxStudents" className="label">
                    Max Students per Session
                  </label>
                  <input
                    type="number"
                    id="maxStudents"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStudents: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Availability Info */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Availability
              </h2>
              
              {tutorAvailability.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900 mb-3">
                    <strong>⚠️ No availability set</strong>
                  </p>
                  <p className="text-sm text-yellow-800 mb-4">
                    You need to set your general availability before creating classes. 
                    Your availability will apply to all your classes.
                  </p>
                  <Link
                    href="/tutor/availability"
                    className="btn-primary inline-block"
                  >
                    Set Your Availability
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-900 text-sm mb-2">
                      <strong>✓ Using your general availability</strong>
                    </p>
                    <p className="text-sm text-green-800">
                      Students will be able to book any of your {tutorAvailability.length} available 
                      time slots for this class.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayRanges = tutorAvailability.filter(s => s.day === day)
                      if (dayRanges.length === 0) return null
                      
                      return (
                        <div key={day} className="bg-secondary-50 rounded-lg p-3">
                          <span className="font-medium text-secondary-900">{day}: </span>
                          <div className="mt-1 space-y-1">
                            {dayRanges.map((range, idx) => (
                              <div key={idx} className="text-secondary-700 text-sm">
                                {formatTimeRange(range.startTime, range.endTime)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-3 text-sm text-secondary-600">
                    <strong>Note:</strong> Based on your {formData.duration}-minute class duration, 
                    students will be able to book at specific times within these ranges.
                  </div>
                  
                  <Link
                    href="/tutor/availability"
                    className="btn-secondary mt-4 inline-block text-sm"
                  >
                    Update Availability
                  </Link>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            <button
              type="submit"
              disabled={loading || tutorAvailability.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Class & Get Booking Link'}
            </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

