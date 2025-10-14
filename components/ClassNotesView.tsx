'use client'

import { User, Target, BookOpen, Phone, AlertCircle, FileText } from 'lucide-react'

interface ClassNotesViewProps {
  notes: any
}

export default function ClassNotesView({ notes }: ClassNotesViewProps) {
  return (
    <div className="space-y-4">
      {notes.student_background && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">Student Background</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{notes.student_background}</p>
            </div>
          </div>
        </div>
      )}

      {notes.learning_style && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">Learning Style</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{notes.learning_style}</p>
            </div>
          </div>
        </div>
      )}

      {notes.goals && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">Goals</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{notes.goals}</p>
            </div>
          </div>
        </div>
      )}

      {notes.parent_contact && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">Parent/Guardian Contact</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{notes.parent_contact}</p>
            </div>
          </div>
        </div>
      )}

      {notes.special_considerations && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-yellow-900 mb-1">Special Considerations</h4>
              <p className="text-yellow-800 whitespace-pre-wrap">{notes.special_considerations}</p>
            </div>
          </div>
        </div>
      )}

      {notes.overall_notes && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">Overall Notes</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{notes.overall_notes}</p>
            </div>
          </div>
        </div>
      )}

      {!notes.student_background && !notes.learning_style && !notes.goals && 
       !notes.parent_contact && !notes.special_considerations && !notes.overall_notes && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No class notes added yet</p>
        </div>
      )}
    </div>
  )
}

