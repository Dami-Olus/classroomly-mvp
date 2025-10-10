'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  BookOpen,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { ClassWithTutor } from '@/types'

export default function ManageClassesPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [classes, setClasses] = useState<ClassWithTutor[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadClasses()
  }, [profile])

  const loadClasses = async () => {
    if (!profile) return

    try {
      // Get tutor profile
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (!tutorData) return

      // Get classes
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('tutor_id', tutorData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClasses(data || [])
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const copyBookingLink = (bookingLink: string, classId: string) => {
    const url = `${window.location.origin}/book/${bookingLink}`
    navigator.clipboard.writeText(url)
    setCopiedId(classId)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleClassStatus = async (classId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !currentStatus })
        .eq('id', classId)

      if (error) throw error

      toast.success(
        !currentStatus ? 'Class activated' : 'Class deactivated'
      )
      loadClasses()
    } catch (error) {
      console.error('Error updating class:', error)
      toast.error('Failed to update class')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading classes...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                My Classes
              </h1>
              <p className="text-secondary-600">
                Manage your tutoring classes and booking links
              </p>
            </div>
            <Link href="/tutor/classes/create" className="btn-primary">
              <Plus className="w-5 h-5 inline-block mr-2" />
              Create New Class
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                No classes yet
              </h2>
              <p className="text-secondary-600 mb-6">
                Create your first class to start receiving bookings
              </p>
              <Link href="/tutor/classes/create" className="btn-primary">
                <Plus className="w-5 h-5 inline-block mr-2" />
                Create Your First Class
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {classes.map((classItem) => (
                <div key={classItem.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-secondary-900">
                          {classItem.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            classItem.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-secondary-100 text-secondary-600'
                          }`}
                        >
                          {classItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-secondary-600 font-medium mb-1">
                        {classItem.subject}
                      </p>
                      {classItem.description && (
                        <p className="text-secondary-600 text-sm">
                          {classItem.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{classItem.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {classItem.weekly_frequency}x/week
                      </span>
                    </div>
                    {classItem.price_per_session && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">
                          ${classItem.price_per_session}/session
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-secondary-600">
                      {(classItem.available_slots as any[])?.length || 0} time slots
                    </div>
                  </div>

                  {/* Booking Link */}
                  <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-secondary-600 mb-2">
                      Shareable booking link:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/book/${classItem.booking_link}`}
                        readOnly
                        className="input flex-1 text-sm font-mono"
                      />
                      <button
                        onClick={() =>
                          copyBookingLink(classItem.booking_link, classItem.id)
                        }
                        className="btn-secondary flex items-center gap-2"
                      >
                        {copiedId === classItem.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      <a
                        href={`/book/${classItem.booking_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleClassStatus(classItem.id, classItem.is_active)
                      }
                      className={
                        classItem.is_active
                          ? 'btn-secondary flex-1'
                          : 'btn-primary flex-1'
                      }
                    >
                      {classItem.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      href={`/tutor/classes/${classItem.id}/edit`}
                      className="btn-outline flex-1 text-center"
                    >
                      Edit Class
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

