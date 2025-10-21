'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  Users, 
  Share2,
  Video,
  FileText,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OnboardingStep {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  completed: boolean
  required: boolean
}

interface OnboardingFlowProps {
  role: 'tutor' | 'student'
  onComplete?: () => void
}

export default function OnboardingFlow({ role, onComplete }: OnboardingFlowProps) {
  const { profile } = useAuth()
  const supabase = createClient()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (profile) {
      loadOnboardingProgress()
    }
  }, [profile])

  const loadOnboardingProgress = async () => {
    try {
      if (role === 'tutor') {
        await loadTutorProgress()
      } else {
        await loadStudentProgress()
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTutorProgress = async () => {
    const tutorSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your bio, expertise, and profile picture',
        href: '/tutor/profile',
        icon: <Users className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'availability',
        title: 'Set Your Availability',
        description: 'Choose when you\'re available for sessions',
        href: '/tutor/availability',
        icon: <Calendar className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'create-class',
        title: 'Create Your First Class',
        description: 'Set up a class that students can book',
        href: '/tutor/classes/create',
        icon: <BookOpen className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'share-link',
        title: 'Share Your Booking Link',
        description: 'Get your unique link to share with students',
        href: '/tutor/classes',
        icon: <Share2 className="w-5 h-5" />,
        completed: false,
        required: true
      }
    ]

    // Check completion status
    const { data: tutorProfile } = await supabase
      .from('tutors')
      .select('*')
      .eq('user_id', profile?.id)
      .single()

    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('tutor_id', tutorProfile?.id)

    const { data: availability } = await supabase
      .from('tutors')
      .select('availability')
      .eq('user_id', profile?.id)
      .single()

    // Update completion status
    const updatedSteps = tutorSteps.map(step => {
      let completed = false
      
      switch (step.id) {
        case 'profile':
          completed = !!(tutorProfile?.bio && tutorProfile?.expertise?.length > 0)
          break
        case 'availability':
          completed = !!(availability?.availability && Object.keys(availability.availability).length > 0)
          break
        case 'create-class':
          completed = !!(classes && classes.length > 0)
          break
        case 'share-link':
          completed = !!(classes && classes.length > 0)
          break
      }
      
      return { ...step, completed }
    })

    setSteps(updatedSteps)
    setProgress(updatedSteps.filter(s => s.completed).length / updatedSteps.length * 100)
  }

  const loadStudentProgress = async () => {
    const studentSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your name and timezone',
        href: '/student/profile',
        icon: <Users className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'get-booking-link',
        title: 'Get a Booking Link',
        description: 'Receive a booking link from your tutor',
        href: '#',
        icon: <Share2 className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'book-session',
        title: 'Book Your First Session',
        description: 'Schedule your first tutoring session',
        href: '#',
        icon: <Calendar className="w-5 h-5" />,
        completed: false,
        required: true
      },
      {
        id: 'join-classroom',
        title: 'Join Your First Class',
        description: 'Enter the virtual classroom for your session',
        href: '#',
        icon: <Video className="w-5 h-5" />,
        completed: false,
        required: true
      }
    ]

    // Check completion status
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('student_id', profile?.id)

    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id')
      .eq('student_id', profile?.id)

    // Update completion status
    const updatedSteps = studentSteps.map(step => {
      let completed = false
      
      switch (step.id) {
        case 'profile':
          completed = !!(profile?.first_name && profile?.last_name)
          break
        case 'get-booking-link':
          completed = true // This is informational
          break
        case 'book-session':
          completed = !!(bookings && bookings.length > 0)
          break
        case 'join-classroom':
          completed = !!(classrooms && classrooms.length > 0)
          break
      }
      
      return { ...step, completed }
    })

    setSteps(updatedSteps)
    setProgress(updatedSteps.filter(s => s.completed).length / updatedSteps.length * 100)
  }

  const handleStepClick = async (step: OnboardingStep) => {
    if (step.completed) return
    
    // For student steps that don't have direct links
    if (role === 'student' && (step.id === 'get-booking-link' || step.id === 'book-session' || step.id === 'join-classroom')) {
      toast('Ask your tutor for a booking link to get started!', {
        icon: 'ℹ️',
        duration: 4000,
      })
      return
    }
    
    // Navigate to the step
    if (step.href !== '#') {
      window.location.href = step.href
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const isComplete = completedSteps === totalSteps

  if (isComplete) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-green-900">
            🎉 Onboarding Complete!
          </h2>
        </div>
        <p className="text-green-800 mb-4">
          You're all set up! You can now start using ClassroomLY to its full potential.
        </p>
        {onComplete && (
          <button
            onClick={onComplete}
            className="btn-primary"
          >
            Get Started
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {role === 'tutor' ? '🚀 Get Started as a Tutor' : '🎯 Get Started as a Student'}
          </h2>
          <p className="text-gray-600 mt-1">
            Complete these steps to set up your account
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {completedSteps}/{totalSteps}
          </div>
          <div className="text-sm text-gray-500">steps completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
              step.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {step.icon}
                <h3 className={`font-medium ${
                  step.completed ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                {step.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                step.completed ? 'text-green-700' : 'text-gray-600'
              }`}>
                {step.description}
              </p>
            </div>

            <div className="flex-shrink-0">
              {step.completed ? (
                <span className="text-green-600 text-sm font-medium">
                  ✓ Done
                </span>
              ) : (
                <button
                  onClick={() => handleStepClick(step)}
                  className="btn-primary text-sm flex items-center space-x-1"
                >
                  <span>Start</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Need Help?</h4>
            <p className="text-sm text-blue-800">
              {role === 'tutor' 
                ? 'Check out our tutor guide or contact support if you need assistance setting up your account.'
                : 'Ask your tutor for help getting started, or contact support if you have questions.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
