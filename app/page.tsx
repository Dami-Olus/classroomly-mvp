import Link from 'next/link'
import {
  Calendar,
  Video,
  Share2,
  MessageSquare,
  FileText,
  Clock,
  BookOpen,
} from 'lucide-react'
import Changelog from '@/components/Changelog'

export default function HomePage() {
  return (
    <div>
      {/* Navbar */}
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
              <Link href="/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Simplify Your Tutoring Journey
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Create shareable booking links, manage sessions, and conduct
              classes—all in one seamless platform.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/signup"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-all border-2 border-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-12">
            Everything You Need in One Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Share2 className="w-8 h-8 text-primary-600" />}
              title="Shareable Booking Links"
              description="Create unique links for each class and share them anywhere. Students can book sessions instantly without complex sign-ups."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-primary-600" />}
              title="Flexible Scheduling"
              description="Set your availability and let students book at their convenience. Easy rescheduling options for both parties."
            />
            <FeatureCard
              icon={<Video className="w-8 h-8 text-primary-600" />}
              title="Integrated Classroom"
              description="Conduct sessions with built-in video calling powered by video.co. Screen sharing and interactive whiteboard included."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-primary-600" />}
              title="Real-time Chat"
              description="Communicate seamlessly before, during, and after sessions with integrated messaging."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-primary-600" />}
              title="Material Sharing"
              description="Upload and share study materials, assignments, and resources directly within the classroom."
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-primary-600" />}
              title="Session Management"
              description="Track completed sessions, manage bookings, and maintain comprehensive session history."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-secondary-50 py-20">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <Step
                number={1}
                title="Create Your Class"
                description="Set up your tutoring class with subject, duration, pricing, and availability."
              />
              <Step
                number={2}
                title="Share Your Link"
                description="Get a unique booking link and share it with students via email, social media, or messaging apps."
              />
              <Step
                number={3}
                title="Students Book Sessions"
                description="Students view your availability and book sessions that fit their schedule—no account required."
              />
              <Step
                number={4}
                title="Conduct Sessions"
                description="Meet in your integrated virtual classroom with all the tools you need to teach effectively."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join hundreds of tutors who are simplifying their tutoring business
            with Classroomly.
          </p>
          <Link
            href="/signup"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all inline-block"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Changelog Section */}
      <Changelog />

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 py-8">
        <div className="container-custom">
          <p className="text-center text-secondary-600">
            &copy; {new Date().getFullYear()} Classroomly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-secondary-600">{description}</p>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-secondary-600">{description}</p>
      </div>
    </div>
  )
}

