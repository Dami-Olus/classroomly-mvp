'use client'

import { Star, TrendingUp, Target, BookOpen, Lock, Edit, Trash2 } from 'lucide-react'

interface SessionNote {
  id: string
  content: string
  topics_covered: string[] | null
  homework_assigned: string | null
  student_performance: string | null
  strengths: string | null
  areas_for_improvement: string | null
  private_notes: string | null
  created_at: string
  updated_at: string
}

interface SessionNotesViewProps {
  note: SessionNote
  showPrivateNotes?: boolean // Only show to tutor
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export default function SessionNotesView({
  note,
  showPrivateNotes = false,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: SessionNotesViewProps) {
  const getPerformanceColor = (performance: string | null) => {
    switch (performance) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'satisfactory':
        return 'bg-yellow-100 text-yellow-800'
      case 'needs_improvement':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceIcon = (performance: string | null) => {
    switch (performance) {
      case 'excellent':
        return '⭐'
      case 'good':
        return '👍'
      case 'satisfactory':
        return '✔️'
      case 'needs_improvement':
        return '📈'
      default:
        return ''
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Session Notes</h3>
          </div>
          <p className="text-sm text-gray-500">
            Added on {new Date(note.created_at).toLocaleDateString()} at{' '}
            {new Date(note.created_at).toLocaleTimeString()}
          </p>
          {note.updated_at !== note.created_at && (
            <p className="text-xs text-gray-400">
              Last updated: {new Date(note.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Actions */}
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit notes"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete notes"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Performance Badge */}
      {note.student_performance && (
        <div>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getPerformanceColor(
              note.student_performance
            )}`}
          >
            <span className="text-lg">{getPerformanceIcon(note.student_performance)}</span>
            Performance: {note.student_performance.charAt(0).toUpperCase() + note.student_performance.slice(1).replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Session Summary</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
      </div>

      {/* Topics Covered */}
      {note.topics_covered && note.topics_covered.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary-600" />
            Topics Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {note.topics_covered.map((topic, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {note.strengths && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strengths
          </h4>
          <p className="text-green-800 whitespace-pre-wrap">{note.strengths}</p>
        </div>
      )}

      {/* Areas for Improvement */}
      {note.areas_for_improvement && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Areas for Improvement
          </h4>
          <p className="text-orange-800 whitespace-pre-wrap">{note.areas_for_improvement}</p>
        </div>
      )}

      {/* Homework */}
      {note.homework_assigned && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Homework Assigned
          </h4>
          <p className="text-blue-800 whitespace-pre-wrap">{note.homework_assigned}</p>
        </div>
      )}

      {/* Private Notes (Tutor Only) */}
      {showPrivateNotes && note.private_notes && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            🔒 Private Notes (Tutor Only)
          </h4>
          <p className="text-yellow-800 whitespace-pre-wrap">{note.private_notes}</p>
          <p className="text-xs text-yellow-600 mt-2">
            This section is not visible to the student
          </p>
        </div>
      )}
    </div>
  )
}

