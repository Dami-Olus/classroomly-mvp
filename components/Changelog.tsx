'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Video, 
  Mail, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  Globe,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'improvement' | 'fix' | 'security'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: string
}

const changelogData: ChangelogEntry[] = [
  {
    version: 'v1.0.0',
    date: 'December 2024',
    type: 'feature',
    title: '🎉 ClassroomLY Beta Launch',
    description: 'Complete tutoring platform with booking, video sessions, materials management, and session tracking.',
    impact: 'high',
    category: 'Platform'
  },
  {
    version: 'v1.0.1',
    date: 'December 2024',
    type: 'feature',
    title: '📧 Email Notifications System',
    description: 'Automated booking confirmations and tutor notifications with beautiful HTML templates.',
    impact: 'high',
    category: 'Communication'
  },
  {
    version: 'v1.0.2',
    date: 'December 2024',
    type: 'feature',
    title: '🌍 Timezone Support',
    description: 'Automatic timezone detection and conversion for global tutors and students.',
    impact: 'high',
    category: 'Scheduling'
  },
  {
    version: 'v1.0.3',
    date: 'December 2024',
    type: 'feature',
    title: '🎨 Collaborative Whiteboard',
    description: 'Integrated Excalidraw whiteboard for interactive teaching sessions.',
    impact: 'medium',
    category: 'Classroom'
  },
  {
    version: 'v1.0.4',
    date: 'December 2024',
    type: 'improvement',
    title: '🔐 Authentication-Aware Booking',
    description: 'Seamless sign-up and sign-in flow during booking process for better user experience.',
    impact: 'high',
    category: 'User Experience'
  },
  {
    version: 'v1.0.5',
    date: 'December 2024',
    type: 'improvement',
    title: '📊 Smart Dashboard Suggestions',
    description: 'Contextual action suggestions based on tutor progress and upcoming sessions.',
    impact: 'medium',
    category: 'Dashboard'
  },
  {
    version: 'v1.0.6',
    date: 'December 2024',
    type: 'improvement',
    title: '📈 Onboarding Progress Tracker',
    description: 'Guided onboarding flow with progress tracking and completion celebration.',
    impact: 'medium',
    category: 'User Experience'
  },
  {
    version: 'v1.0.7',
    date: 'December 2024',
    type: 'fix',
    title: '🔧 Whiteboard Session Isolation',
    description: 'Fixed whiteboard content isolation to prevent cross-session data leakage.',
    impact: 'high',
    category: 'Security'
  },
  {
    version: 'v1.0.8',
    date: 'December 2024',
    type: 'fix',
    title: '⏰ Timezone Conversion Fix',
    description: 'Resolved day-shift issues in timezone conversion for accurate scheduling.',
    impact: 'high',
    category: 'Scheduling'
  },
  {
    version: 'v1.0.9',
    date: 'December 2024',
    type: 'improvement',
    title: '📱 Mobile-Responsive Design',
    description: 'Enhanced mobile experience with improved responsive design across all features.',
    impact: 'medium',
    category: 'User Experience'
  }
]

const categoryIcons = {
  'Platform': Globe,
  'Communication': Mail,
  'Scheduling': Clock,
  'Classroom': Video,
  'User Experience': Users,
  'Dashboard': FileText,
  'Security': Shield
}

const typeColors = {
  feature: 'bg-green-100 text-green-800 border-green-200',
  improvement: 'bg-blue-100 text-blue-800 border-blue-200',
  fix: 'bg-orange-100 text-orange-800 border-orange-200',
  security: 'bg-red-100 text-red-800 border-red-200'
}

const impactColors = {
  high: 'text-red-600 font-semibold',
  medium: 'text-yellow-600 font-semibold',
  low: 'text-green-600 font-semibold'
}

export default function Changelog() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['v1.0.0']))
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(changelogData.map(entry => entry.category)))]
  const types = ['all', ...Array.from(new Set(changelogData.map(entry => entry.type)))]

  const filteredData = changelogData.filter(entry => {
    const categoryMatch = filterCategory === 'all' || entry.category === filterCategory
    const typeMatch = filterType === 'all' || entry.type === filterType
    return categoryMatch && typeMatch
  })

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(version)) {
      newExpanded.delete(version)
    } else {
      newExpanded.add(version)
    }
    setExpandedVersions(newExpanded)
  }

  const groupedData = filteredData.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = []
    }
    acc[entry.version].push(entry)
    return acc
  }, {} as Record<string, ChangelogEntry[]>)

  return (
    <div className="bg-white py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What's New in ClassroomLY
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest features, improvements, and fixes we're constantly adding to make your tutoring experience better.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-6">
          {Object.entries(groupedData).map(([version, entries]) => {
            const isExpanded = expandedVersions.has(version)
            const versionDate = entries[0]?.date
            
            return (
              <div key={version} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleVersion(version)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{version}</span>
                      <span className="text-sm text-gray-500">{versionDate}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {entries.length} {entries.length === 1 ? 'update' : 'updates'}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 py-4 space-y-4">
                    {entries.map((entry, index) => {
                      const CategoryIcon = categoryIcons[entry.category as keyof typeof categoryIcons] || FileText
                      
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CategoryIcon className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${typeColors[entry.type]}`}>
                                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                              </span>
                              <span className={`text-xs ${impactColors[entry.impact]}`}>
                                {entry.impact.toUpperCase()} IMPACT
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {entry.category}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {entry.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Experience These Features?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of tutors who are already using ClassroomLY to streamline their teaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="btn-primary inline-flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/login"
                className="btn-secondary inline-flex items-center gap-2"
              >
                Sign In
                <CheckCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
