'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  BookOpen, 
  Video, 
  FileText, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  UserCheck,
  Mail,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  totalTutors: number
  totalStudents: number
  totalClasses: number
  totalBookings: number
  activeClassrooms: number
  completedSessions: number
  totalMaterials: number
  totalNotes: number
  pendingReschedules: number
  tutorsWithClasses: number
  studentsWithBookings: number
}

interface RecentActivity {
  type: 'signup' | 'class_created' | 'booking' | 'session' | 'material' | 'note'
  description: string
  timestamp: string
  user?: string
}

interface UserMetrics {
  id: string
  name: string
  email: string
  role: string
  signupDate: string
  lastActivity?: string
  // Tutor-specific
  classesCreated?: number
  bookingsReceived?: number
  studentsCount?: number
  completedSessions?: number
  // Student-specific
  bookingsMade?: number
  classesEnrolled?: number
  sessionsCompleted?: number
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTutors: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalBookings: 0,
    activeClassrooms: 0,
    completedSessions: 0,
    totalMaterials: 0,
    totalNotes: 0,
    pendingReschedules: 0,
    tutorsWithClasses: 0,
    studentsWithBookings: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview')
  const [users, setUsers] = useState<UserMetrics[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData()
    }
  }, [profile])

  const loadAdminData = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get tutors
      const { count: tutorsCount } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })

      // Get students (count profiles with role=student)
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      // Get classes
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })

      // Get bookings
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('status, completed_sessions')

      const totalBookings = allBookings?.length || 0
      const completedBookings = allBookings?.filter((b: any) => b.status === 'completed').length || 0
      const completedSessions = allBookings?.reduce((sum: number, b: any) => sum + (b.completed_sessions || 0), 0) || 0

      // Get active classrooms
      const { count: activeClassroomsCount } = await supabase
        .from('classrooms')
        .select('*', { count: 'exact', head: true })
        .in('status', ['live', 'scheduled'])

      // Get materials
      const { count: materialsCount } = await supabase
        .from('session_materials')
        .select('*', { count: 'exact', head: true })

      // Get session notes
      const { count: notesCount } = await supabase
        .from('session_notes')
        .select('*', { count: 'exact', head: true })

      // Get pending reschedules
      const { count: pendingReschedulesCount } = await supabase
        .from('reschedule_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get tutors with classes
      const { data: tutorsWithClasses } = await supabase
        .from('classes')
        .select('tutor_id')
      
      const uniqueTutorsWithClasses = new Set(tutorsWithClasses?.map((c: any) => c.tutor_id) || []).size

      // Get students with bookings
      const { data: studentsWithBookings } = await supabase
        .from('bookings')
        .select('student_id')
        .not('student_id', 'is', null)
      
      const uniqueStudentsWithBookings = new Set(studentsWithBookings?.map((b: any) => b.student_id) || []).size

      setStats({
        totalUsers: usersCount || 0,
        totalTutors: tutorsCount || 0,
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        totalBookings,
        activeClassrooms: activeClassroomsCount || 0,
        completedSessions,
        totalMaterials: materialsCount || 0,
        totalNotes: notesCount || 0,
        pendingReschedules: pendingReschedulesCount || 0,
        tutorsWithClasses: uniqueTutorsWithClasses,
        studentsWithBookings: uniqueStudentsWithBookings,
      })

      // Load recent activity (last 20 items)
      await loadRecentActivity()

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadUserMetrics = async () => {
    setUsersLoading(true)
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get metrics for each user
      const userMetricsPromises = (profiles || []).map(async (profile: any) => {
        const userId = profile.id
        const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
        const metrics: UserMetrics = {
          id: userId,
          name: userName,
          email: profile.email,
          role: profile.role,
          signupDate: profile.created_at,
        }

        if (profile.role === 'tutor') {
          // Get tutor record
          const { data: tutor } = await supabase
            .from('tutors')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (tutor) {
            // Count classes
            const { count: classesCount } = await supabase
              .from('classes')
              .select('*', { count: 'exact', head: true })
              .eq('tutor_id', tutor.id)
            
            metrics.classesCreated = classesCount || 0

            // Get bookings for tutor's classes
            const { data: classes } = await supabase
              .from('classes')
              .select('id')
              .eq('tutor_id', tutor.id)
            
            if (classes && classes.length > 0) {
              const classIds = classes.map(c => c.id)
              const { data: bookings } = await supabase
                .from('bookings')
                .select('id, completed_sessions, student_id')
                .in('class_id', classIds)
              
              metrics.bookingsReceived = bookings?.length || 0
              metrics.completedSessions = bookings?.reduce((sum: number, b: any) => sum + (b.completed_sessions || 0), 0) || 0
              
              // Count unique students
              const studentIds = new Set(bookings?.map((b: any) => b.student_id).filter(Boolean) || [])
              metrics.studentsCount = studentIds.size
            }
          }
        } else if (profile.role === 'student') {
          // Count bookings
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id, completed_sessions, class_id')
            .eq('student_id', userId)
          
          metrics.bookingsMade = bookings?.length || 0
          metrics.sessionsCompleted = bookings?.reduce((sum: number, b: any) => sum + (b.completed_sessions || 0), 0) || 0
          
          // Count unique classes
          if (bookings && bookings.length > 0) {
            const classIds = new Set(bookings.map((b: any) => b.class_id).filter(Boolean))
            metrics.classesEnrolled = classIds.size
          }
        }

        // Get last activity (most recent booking related to this user)
        let lastActivity = profile.created_at // Default to signup date

        if (profile.role === 'student') {
          // For students, get most recent booking
          const { data: lastBookingData } = await supabase
            .from('bookings')
            .select('created_at')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)

          if (lastBookingData && lastBookingData.length > 0) {
            lastActivity = lastBookingData[0].created_at
          }
        } else if (profile.role === 'tutor') {
          // For tutors, get most recent booking for their classes
          const { data: tutor } = await supabase
            .from('tutors')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (tutor) {
            const { data: classes } = await supabase
              .from('classes')
              .select('id')
              .eq('tutor_id', tutor.id)

            if (classes && classes.length > 0) {
              const classIds = classes.map(c => c.id)
              const { data: lastBookingData } = await supabase
                .from('bookings')
                .select('created_at')
                .in('class_id', classIds)
                .order('created_at', { ascending: false })
                .limit(1)

              if (lastBookingData && lastBookingData.length > 0) {
                lastActivity = lastBookingData[0].created_at
              }
            }
          }
        }

        metrics.lastActivity = lastActivity

        return metrics
      })

      const userMetrics = await Promise.all(userMetricsPromises)
      setUsers(userMetrics)
    } catch (error) {
      console.error('Error loading user metrics:', error)
      toast.error('Failed to load user metrics')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && profile?.role === 'admin') {
      loadUserMetrics()
    }
  }, [activeTab, profile])

  const loadRecentActivity = async () => {
    try {
      const activity: RecentActivity[] = []

      // Recent signups
      const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('first_name, last_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      recentProfiles?.forEach((p: any) => {
        activity.push({
          type: 'signup',
          description: `${p.first_name} ${p.last_name} signed up as ${p.role}`,
          timestamp: p.created_at,
          user: `${p.first_name} ${p.last_name}`,
        })
      })

      // Recent classes
      const { data: recentClasses } = await supabase
        .from('classes')
        .select('title, created_at, tutor_id')
        .order('created_at', { ascending: false })
        .limit(5)

      // Get tutor info for each class
      for (const c of recentClasses || []) {
        if ((c as any).tutor_id) {
          const { data: tutor } = await supabase
            .from('tutors')
            .select('user_id')
            .eq('id', (c as any).tutor_id)
            .single()

          if (tutor?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', tutor.user_id)
              .single()

            if (profile) {
              const tutorName = `${(profile as any).first_name} ${(profile as any).last_name}`
              activity.push({
                type: 'class_created',
                description: `${tutorName} created class: ${(c as any).title}`,
                timestamp: (c as any).created_at,
                user: tutorName,
              })
            }
          }
        }
      }

      // Recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('student_name, created_at, classes(title)')
        .order('created_at', { ascending: false })
        .limit(5)

      recentBookings?.forEach((b: any) => {
        activity.push({
          type: 'booking',
          description: `${b.student_name} booked: ${b.classes?.title}`,
          timestamp: b.created_at,
          user: b.student_name,
        })
      })

      // Sort all activity by timestamp
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      setRecentActivity(activity.slice(0, 15))
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Platform metrics, analytics, and monitoring
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                User Management
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalTutors} tutors • {stats.totalStudents} students
                  </p>
                </div>
                <Users className="w-12 h-12 text-primary-600 opacity-20" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.tutorsWithClasses} tutors active
                  </p>
                </div>
                <BookOpen className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.studentsWithBookings} students booked
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedSessions}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total sessions delivered
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Active Classrooms</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeClassrooms}</p>
                </div>
              </div>
            </div>

            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-900 font-medium">Materials Shared</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalMaterials}</p>
                </div>
              </div>
            </div>

            <div className="card bg-purple-50 border-purple-200">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-900 font-medium">Session Notes</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalNotes}</p>
                </div>
              </div>
            </div>

            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-900 font-medium">Pending Reschedules</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pendingReschedules}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Platform Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tutor Activation</span>
                  <span className="font-semibold">
                    {stats.totalTutors > 0 
                      ? Math.round((stats.tutorsWithClasses / stats.totalTutors) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ 
                      width: `${stats.totalTutors > 0 
                        ? (stats.tutorsWithClasses / stats.totalTutors) * 100 
                        : 0}%` 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">Student Conversion</span>
                  <span className="font-semibold">
                    {stats.totalStudents > 0 
                      ? Math.round((stats.studentsWithBookings / stats.totalStudents) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ 
                      width: `${stats.totalStudents > 0 
                        ? (stats.studentsWithBookings / stats.totalStudents) * 100 
                        : 0}%` 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">Avg. Bookings/Class</span>
                  <span className="font-semibold">
                    {stats.totalClasses > 0 
                      ? (stats.totalBookings / stats.totalClasses).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Content Creation</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Materials per Session</span>
                  <span className="font-semibold">
                    {stats.completedSessions > 0 
                      ? (stats.totalMaterials / stats.completedSessions).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Notes per Session</span>
                  <span className="font-semibold">
                    {stats.completedSessions > 0 
                      ? ((stats.totalNotes / stats.completedSessions) * 100).toFixed(0)
                      : '0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Reschedule Rate</span>
                  <span className="font-semibold">
                    {stats.totalBookings > 0 
                      ? ((stats.pendingReschedules / stats.totalBookings) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Avg. Students/Tutor</span>
                  <span className="font-semibold">
                    {stats.totalTutors > 0 
                      ? (stats.studentsWithBookings / stats.totalTutors).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Avg. Classes/Tutor</span>
                  <span className="font-semibold">
                    {stats.totalTutors > 0 
                      ? (stats.totalClasses / stats.totalTutors).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Session Completion</span>
                  <span className="font-semibold text-green-600">
                    {stats.totalBookings > 0 
                      ? Math.round((stats.completedSessions / stats.totalBookings) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <button 
                onClick={loadAdminData}
                className="btn-secondary text-sm"
              >
                Refresh
              </button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'signup' ? 'bg-blue-100' :
                      activity.type === 'class_created' ? 'bg-green-100' :
                      activity.type === 'booking' ? 'bg-purple-100' :
                      activity.type === 'session' ? 'bg-orange-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'signup' && <Users className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'class_created' && <BookOpen className="w-4 h-4 text-green-600" />}
                      {activity.type === 'booking' && <Calendar className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'session' && <Video className="w-4 h-4 text-orange-600" />}
                      {activity.type === 'material' && <FileText className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          ) : (
            <>
              {/* User Management */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>
                  <button
                    onClick={loadUserMetrics}
                    disabled={usersLoading}
                    className="btn-secondary"
                  >
                    Refresh
                  </button>
                </div>

                {usersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user metrics...</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Metrics
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Signup Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Activity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users
                            .filter(user => 
                              user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                      <UserCheck className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.role === 'tutor' ? 'bg-blue-100 text-blue-800' :
                                    user.role === 'student' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900">
                                    {user.role === 'tutor' ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="w-4 h-4 text-gray-400" />
                                          <span>{user.classesCreated || 0} classes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-gray-400" />
                                          <span>{user.studentsCount || 0} students</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-gray-400" />
                                          <span>{user.bookingsReceived || 0} bookings</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-gray-400" />
                                          <span>{user.completedSessions || 0} sessions</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-gray-400" />
                                          <span>{user.bookingsMade || 0} bookings</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="w-4 h-4 text-gray-400" />
                                          <span>{user.classesEnrolled || 0} classes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-gray-400" />
                                          <span>{user.sessionsCompleted || 0} sessions</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.signupDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.lastActivity 
                                    ? new Date(user.lastActivity).toLocaleDateString()
                                    : 'Never'
                                  }
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {users.filter(user => 
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No users found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function StatCard({ icon, title, value, change }: any) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-secondary-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change && <p className="text-xs text-green-600">{change}</p>}
      </div>
    </div>
  )
}

