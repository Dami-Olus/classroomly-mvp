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
  Plus, 
  Calendar, 
  FileText, 
  Download,
  Share2,
  TrendingUp,
  CheckCircle,
  Edit
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getBookingSessions, getSessionStats } from '@/lib/sessions'

export default function TutorReportsPage() {
  const params = useParams()
  const { profile } = useAuth()
  const supabase = createClient()
  
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionNotes, setSessionNotes] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNewReportForm, setShowNewReportForm] = useState(false)
  const [reportForm, setReportForm] = useState({
    report_period: '',
    start_date: '',
    end_date: '',
    overall_summary: '',
    strengths: '',
    areas_for_improvement: '',
    recommendations: '',
    next_steps: '',
  })

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

      // Get tutor ID
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      setTutor(tutorData)

      // Load sessions
      const sessionsData = await getBookingSessions(bookingId)
      setSessions(sessionsData)

      // Load session stats
      const statsData = await getSessionStats(bookingId)
      setStats(statsData)

      // Load all session notes
      const { data: notesData } = await supabase
        .from('session_notes')
        .select('*')
        .in('session_id', sessionsData.map((s: any) => s.id))
        .order('created_at', { ascending: true })

      setSessionNotes(notesData || [])

      // Load existing reports
      const { data: reportsData } = await supabase
        .from('class_reports')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      setReports(reportsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Get sessions in date range
      const sessionsInRange = sessions.filter(s => {
        const sessionDate = new Date(s.scheduled_date)
        const start = new Date(reportForm.start_date)
        const end = new Date(reportForm.end_date)
        return sessionDate >= start && sessionDate <= end
      })

      const completedSessions = sessionsInRange.filter(s => s.status === 'completed').length
      const totalHours = sessionsInRange
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration || 0), 0) / 60

      const { error } = await supabase
        .from('class_reports')
        .insert({
          class_id: booking.class.id,
          booking_id: bookingId,
          tutor_id: tutor?.id,
          student_id: booking.student_id,
          report_period: reportForm.report_period,
          start_date: reportForm.start_date,
          end_date: reportForm.end_date,
          sessions_completed: completedSessions,
          total_hours: totalHours,
          overall_summary: reportForm.overall_summary,
          strengths: reportForm.strengths,
          areas_for_improvement: reportForm.areas_for_improvement,
          recommendations: reportForm.recommendations,
          next_steps: reportForm.next_steps,
          is_shared_with_student: false,
        })

      if (error) throw error

      toast.success('Report generated successfully!')
      setShowNewReportForm(false)
      setReportForm({
        report_period: '',
        start_date: '',
        end_date: '',
        overall_summary: '',
        strengths: '',
        areas_for_improvement: '',
        recommendations: '',
        next_steps: '',
      })
      loadData()
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error(error.message || 'Failed to generate report')
    }
  }

  const handleShareReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('class_reports')
        .update({ 
          is_shared_with_student: true,
          shared_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) throw error

      toast.success('Report shared with student!')
      loadData()
    } catch (error) {
      console.error('Error sharing report:', error)
      toast.error('Failed to share report')
    }
  }

  const handleAutoFillSummary = () => {
    // Auto-generate summary from session notes
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const notesForCompleted = sessionNotes.filter(note => 
      completedSessions.some(s => s.id === note.session_id)
    )

    let summary = `Progress Summary:\n\n`
    summary += `Total Sessions Completed: ${stats?.completed || 0}\n`
    summary += `Total Hours: ${stats?.totalHours || 0} hours\n\n`

    if (notesForCompleted.length > 0) {
      summary += `Topics Covered:\n`
      notesForCompleted.forEach((note, i) => {
        if (note.topics_covered) {
          summary += `Session ${i + 1}: ${note.topics_covered}\n`
        }
      })
    }

    setReportForm({ ...reportForm, overall_summary: summary })
    toast.success('Summary auto-generated from session notes')
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
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
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Booking not found</p>
            <Link href="/tutor/bookings" className="btn-primary mt-4">
              Back to Bookings
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/tutor/bookings/${bookingId}`}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Class Reports
                </h1>
                <p className="text-gray-600">{booking.class.title}</p>
                <p className="text-sm text-gray-500">Student: {booking.student_name}</p>
              </div>
              
              {!showNewReportForm && (
                <button
                  onClick={() => setShowNewReportForm(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Generate New Report
                </button>
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
                <p className="text-2xl font-bold text-purple-600">{sessionNotes.length}</p>
                <p className="text-sm text-gray-600">Session Notes</p>
              </div>
            </div>
          )}

          {/* New Report Form */}
          {showNewReportForm && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Generate New Report</h2>
                <button
                  onClick={() => setShowNewReportForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleGenerateReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Report Period *</label>
                    <input
                      type="text"
                      value={reportForm.report_period}
                      onChange={(e) => setReportForm({ ...reportForm, report_period: e.target.value })}
                      className="input"
                      placeholder="e.g., January 2024, Month 1, Q1 2024"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Start Date *</label>
                    <input
                      type="date"
                      value={reportForm.start_date}
                      onChange={(e) => setReportForm({ ...reportForm, start_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">End Date *</label>
                    <input
                      type="date"
                      value={reportForm.end_date}
                      onChange={(e) => setReportForm({ ...reportForm, end_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">Overall Summary *</label>
                    <button
                      type="button"
                      onClick={handleAutoFillSummary}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Auto-generate from notes
                    </button>
                  </div>
                  <textarea
                    value={reportForm.overall_summary}
                    onChange={(e) => setReportForm({ ...reportForm, overall_summary: e.target.value })}
                    className="input"
                    rows={5}
                    placeholder="Overall progress and achievements during this period..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Strengths *</label>
                  <textarea
                    value={reportForm.strengths}
                    onChange={(e) => setReportForm({ ...reportForm, strengths: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="What is the student doing well?"
                    required
                  />
                </div>

                <div>
                  <label className="label">Areas for Improvement *</label>
                  <textarea
                    value={reportForm.areas_for_improvement}
                    onChange={(e) => setReportForm({ ...reportForm, areas_for_improvement: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="What areas need more focus?"
                    required
                  />
                </div>

                <div>
                  <label className="label">Recommendations</label>
                  <textarea
                    value={reportForm.recommendations}
                    onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Recommendations for continued improvement..."
                  />
                </div>

                <div>
                  <label className="label">Next Steps</label>
                  <textarea
                    value={reportForm.next_steps}
                    onChange={(e) => setReportForm({ ...reportForm, next_steps: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="What will we focus on in the next period?"
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Generate Report
                </button>
              </form>
            </div>
          )}

          {/* Existing Reports */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>
            
            {reports.length === 0 ? (
              <div className="card text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No reports generated yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first report to track student progress over time
                </p>
                <button
                  onClick={() => setShowNewReportForm(true)}
                  className="btn-primary"
                >
                  Generate First Report
                </button>
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
                          {report.sessions_completed} sessions • {report.total_hours} hours
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {report.is_shared_with_student ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Shared
                          </span>
                        ) : (
                          <button
                            onClick={() => handleShareReport(report.id)}
                            className="btn-secondary text-sm flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share with Student
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <strong className="text-gray-900">Summary:</strong>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{report.overall_summary}</p>
                      </div>
                      
                      <div>
                        <strong className="text-gray-900">Strengths:</strong>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{report.strengths}</p>
                      </div>
                      
                      <div>
                        <strong className="text-gray-900">Areas for Improvement:</strong>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{report.areas_for_improvement}</p>
                      </div>
                      
                      {report.recommendations && (
                        <div>
                          <strong className="text-gray-900">Recommendations:</strong>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{report.recommendations}</p>
                        </div>
                      )}
                      
                      {report.next_steps && (
                        <div>
                          <strong className="text-gray-900">Next Steps:</strong>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{report.next_steps}</p>
                        </div>
                      )}
                    </div>

                    {report.is_shared_with_student && report.shared_at && (
                      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                        Shared on {new Date(report.shared_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

