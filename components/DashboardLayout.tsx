'use client'

import { useState, useEffect } from 'react'
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
  Menu,
  X,
  ChevronLeft,
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
  
  // Collapsed state - default to true (collapsed, icons only)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsCollapsed(true) // Always collapsed on mobile initially
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        <div className="container-custom px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                <span className="text-xl md:text-2xl font-bold text-primary-600">
                  Classroomly
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-secondary-600 hidden sm:inline truncate max-w-[120px] md:max-w-none">
                {profile?.first_name} {profile?.last_name}
              </span>
              <button 
                onClick={signOut} 
                className="btn-secondary text-xs md:text-sm flex items-center gap-1 md:gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-secondary-200 transition-all duration-300 ease-in-out",
          "fixed md:relative z-40 h-[calc(100vh-64px)]",
          isCollapsed ? "w-16" : "w-64",
          isMobile && !isCollapsed && "shadow-xl"
        )}>
          {/* Collapse toggle button - desktop */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-4 z-50 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-50 transition-transform"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={cn(
                "w-4 h-4 transition-transform duration-300",
                isCollapsed && "transform rotate-180"
              )} />
            </button>
          )}

          {/* Close button - mobile */}
          {isMobile && !isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <nav className="space-y-2 p-2 md:p-4">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isCollapsed ? link.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg transition-all group',
                    isCollapsed ? 'justify-center px-3' : 'space-x-3 px-4',
                    'py-2.5 md:py-3',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  )}
                  onClick={() => isMobile && setIsCollapsed(true)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {isMobile && !isCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          "p-4 md:p-6 lg:p-8",
          "w-full"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
