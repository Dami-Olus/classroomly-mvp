'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, BookOpen, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuth()

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-secondary-600">
              Manage your tutoring sessions and track your progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<Calendar className="w-6 h-6 text-primary-600" />}
              title="Upcoming Sessions"
              value="0"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-green-600" />}
              title="Active Bookings"
              value="0"
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-blue-600" />}
              title="Completed Sessions"
              value="0"
            />
          </div>

          {/* Upcoming Sessions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600 mb-4">
                You don't have any upcoming sessions
              </p>
            </div>
          </div>

          {/* Getting Started */}
          <div className="card bg-primary-50 border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              🎯 Get Started
            </h2>
            <p className="text-primary-800 mb-4">
              Receive a booking link from your tutor to schedule your first
              session!
            </p>
            <p className="text-sm text-primary-700">
              When a tutor shares their class link with you, you can book
              sessions instantly without any complex setup.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-2xl font-bold text-secondary-900 mb-1">{value}</p>
      <p className="text-sm text-secondary-600">{title}</p>
    </div>
  )
}

