'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  BookOpen,
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  PlusCircle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const isTutor = profile?.role === 'tutor'
  const isAdmin = profile?.role === 'admin'

  const adminLinks = [
    {
      href: '/admin/dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
    },
  ]

  const tutorLinks = [
    {
      href: '/tutor/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/tutor/availability',
      label: 'Availability',
      icon: Calendar,
    },
    {
      href: '/tutor/classes',
      label: 'My Classes',
      icon: BookOpen,
    },
    {
      href: '/tutor/classes/create',
      label: 'Create Class',
      icon: PlusCircle,
    },
    {
      href: '/tutor/bookings',
      label: 'Bookings',
      icon: Calendar,
    },
    {
      href: '/tutor/profile',
      label: 'Profile',
      icon: Settings,
    },
  ]

  const studentLinks = [
    {
      href: '/student/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/student/bookings',
      label: 'My Bookings',
      icon: Calendar,
    },
    {
      href: '/student/profile',
      label: 'Profile',
      icon: Settings,
    },
  ]

  const links = isAdmin ? adminLinks : isTutor ? tutorLinks : studentLinks

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-secondary-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-600">
                Classroomly
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-secondary-600">
                {profile?.first_name} {profile?.last_name}
              </span>
              <button onClick={signOut} className="btn-secondary text-sm">
                <LogOut className="w-4 h-4 inline-block mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-secondary-200 min-h-[calc(100vh-64px)] p-4">
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}

