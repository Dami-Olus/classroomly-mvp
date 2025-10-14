'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Download,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getBookingSessions, getSessionStats } from '@/lib/sessions'

export default function StudentReportsPage() {
  const params = useParams()
  const { profile } = useAuth()
  const supabase = createClient()
  
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [bookingId])

  const loadData = async () => {
    try {
      // Load booking with class info
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            id,
            title,
            subject,
            tutor_id
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData)

      // Load tutor info
      if (bookingData.class?.tutor_id) {
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('user_id')
          .eq('id', bookingData.class.tutor_id)
          .single()

        if (tutorData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', tutorData.user_id)
            .single()

          setTutor(profileData)
        }
      }

      // Load session stats
      const statsData = await getSessionStats(bookingId)
      setStats(statsData)

      // Load shared reports only
      const { data: reportsData } = await supabase
        .from('class_reports')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('is_shared_with_student', true)
        .order('created_at', { ascending: false })

      setReports(reportsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!booking) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Booking not found</p>
            <Link href="/student/bookings" className="btn-primary mt-4">
              Back to Bookings
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/student/bookings/${bookingId}`}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking
            </Link>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Progress Reports
              </h1>
              <p className="text-gray-600">{booking.class.title}</p>
              {tutor && (
                <p className="text-sm text-gray-500">
                  Tutor: {tutor.first_name} {tutor.last_name}
                </p>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="card text-center">
                <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <div className="card text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="card text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.totalHours}h</p>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
              <div className="card text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{reports.length}</p>
                <p className="text-sm text-gray-600">Reports Available</p>
              </div>
            </div>
          )}

          {/* Reports */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Progress Reports</h2>
            
            {reports.length === 0 ? (
              <div className="card text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No reports available yet
                </h3>
                <p className="text-gray-600">
                  Your tutor will share progress reports with you after each period
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {report.report_period}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {report.sessions_completed} sessions completed • {report.total_hours} hours
                        </p>
                      </div>
                      
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Shared on {new Date(report.shared_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Overall Summary</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{report.overall_summary}</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                        <p className="text-green-800 whitespace-pre-wrap">{report.strengths}</p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-2">Areas for Improvement</h4>
                        <p className="text-yellow-800 whitespace-pre-wrap">{report.areas_for_improvement}</p>
                      </div>
                      
                      {report.recommendations && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                          <p className="text-blue-800 whitespace-pre-wrap">{report.recommendations}</p>
                        </div>
                      )}
                      
                      {report.next_steps && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2">Next Steps</h4>
                          <p className="text-purple-800 whitespace-pre-wrap">{report.next_steps}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="card bg-blue-50 border-blue-200 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">About These Reports</h3>
            <p className="text-sm text-blue-800">
              Your tutor creates these progress reports to track your learning journey. Each report 
              summarizes what you've learned, highlights your strengths, and identifies areas where 
              you can improve. Use these reports to celebrate your progress and focus on your goals!
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

