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
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsMobileMenuOpen(false) // Close menu on mobile resize
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
      <nav className="bg-white border-b border-secondary-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 -ml-2 sm:ml-0 flex-shrink-0"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              
              <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary-600 flex-shrink-0" />
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 truncate">
                  Classroomly
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-xs sm:text-sm text-secondary-600 hidden xs:inline truncate max-w-[90px] sm:max-w-none">
                {profile?.first_name} {profile?.last_name}
              </span>
              <button 
                onClick={signOut} 
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5 sm:gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "bg-white border-r border-secondary-200 transition-all duration-300 ease-in-out group",
            "hidden lg:block h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}
          onMouseEnter={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
          onMouseLeave={() => !isSidebarCollapsed && setIsSidebarCollapsed(true)}
        >
          {/* Desktop collapse toggle button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-4 z-50 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-50 transition-transform opacity-0 group-hover:opacity-100"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform duration-300",
              isSidebarCollapsed && "transform rotate-180"
            )} />
          </button>

          <nav className="space-y-2 p-2 sm:p-4">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isSidebarCollapsed ? link.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg transition-all relative',
                    isSidebarCollapsed ? 'justify-center px-3' : 'space-x-3 px-4',
                    'py-2.5 sm:py-3',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate text-sm">{link.label}</span>}
                  {isSidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {link.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        <div className={cn(
          "fixed inset-0 bg-black transition-opacity duration-300 z-40 lg:hidden",
          isMobileMenuOpen ? "opacity-50 visible" : "opacity-0 invisible"
        )}>
          <aside className={cn(
            "bg-white h-full w-64 shadow-2xl transition-transform duration-300",
            "flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold text-lg">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                      'text-base',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-600 hover:bg-secondary-50'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          "p-3 sm:p-4 md:p-6 lg:p-8",
          "w-full min-w-0"
        )}>
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}