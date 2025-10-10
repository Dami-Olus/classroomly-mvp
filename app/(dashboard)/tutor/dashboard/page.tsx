'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { BookOpen, Calendar, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function TutorDashboard() {
  const { profile } = useAuth()

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-secondary-600">
              Here's an overview of your tutoring activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-primary-600" />}
              title="Active Classes"
              value="0"
              change="+0%"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6 text-green-600" />}
              title="Total Bookings"
              value="0"
              change="+0%"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              title="Students"
              value="0"
              change="+0%"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
              title="Completed Sessions"
              value="0"
              change="+0%"
            />
          </div>

          {/* Quick Actions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/tutor/classes/create"
                className="btn-primary text-center"
              >
                Create New Class
              </Link>
              <Link
                href="/tutor/classes"
                className="btn-secondary text-center"
              >
                View My Classes
              </Link>
              <Link
                href="/tutor/bookings"
                className="btn-secondary text-center"
              >
                View Bookings
              </Link>
            </div>
          </div>

          {/* Getting Started */}
          <div className="card bg-primary-50 border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              🚀 Getting Started
            </h2>
            <div className="space-y-3">
              <Step
                number={1}
                text="Complete your tutor profile"
                href="/tutor/profile"
              />
              <Step
                number={2}
                text="Set your general availability"
                href="/tutor/availability"
              />
              <Step
                number={3}
                text="Create your first class"
                href="/tutor/classes/create"
              />
              <Step
                number={4}
                text="Share your booking link with students"
                href="/tutor/classes"
              />
            </div>
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
  change,
}: {
  icon: React.ReactNode
  title: string
  value: string
  change: string
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xs text-green-600 font-medium">{change}</span>
      </div>
      <p className="text-2xl font-bold text-secondary-900 mb-1">{value}</p>
      <p className="text-sm text-secondary-600">{title}</p>
    </div>
  )
}

function Step({
  number,
  text,
  href,
}: {
  number: number
  text: string
  href: string
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <Link
        href={href}
        className="text-primary-900 hover:text-primary-700 font-medium"
      >
        {text}
      </Link>
    </div>
  )
}

