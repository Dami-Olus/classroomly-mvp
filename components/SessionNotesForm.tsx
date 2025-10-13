'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface SessionNote {
  id?: string
  content: string
  topics_covered: string[]
  homework_assigned: string
  student_performance: string
  strengths: string
  areas_for_improvement: string
  private_notes: string
}

interface SessionNotesFormProps {
  bookingId: string
  tutorId: string
  existingNote?: SessionNote | null
  onSave: () => void
  onCancel?: () => void
}

export default function SessionNotesForm({
  bookingId,
  tutorId,
  existingNote,
  onSave,
  onCancel,
}: SessionNotesFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  
  const [formData, setFormData] = useState<SessionNote>({
    content: existingNote?.content || '',
    topics_covered: existingNote?.topics_covered || [],
    homework_assigned: existingNote?.homework_assigned || '',
    student_performance: existingNote?.student_performance || '',
    strengths: existingNote?.strengths || '',
    areas_for_improvement: existingNote?.areas_for_improvement || '',
    private_notes: existingNote?.private_notes || '',
  })

  useEffect(() => {
    if (existingNote) {
      setFormData({
        content: existingNote.content || '',
        topics_covered: existingNote.topics_covered || [],
        homework_assigned: existingNote.homework_assigned || '',
        student_performance: existingNote.student_performance || '',
        strengths: existingNote.strengths || '',
        areas_for_improvement: existingNote.areas_for_improvement || '',
        private_notes: existingNote.private_notes || '',
      })
    }
  }, [existingNote])

  const addTopic = () => {
    if (topicInput.trim()) {
      setFormData({
        ...formData,
        topics_covered: [...formData.topics_covered, topicInput.trim()],
      })
      setTopicInput('')
    }
  }

  const removeTopic = (index: number) => {
    setFormData({
      ...formData,
      topics_covered: formData.topics_covered.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast.error('Please add session notes')
      return
    }

    setSaving(true)

    try {
      const noteData = {
        booking_id: bookingId,
        tutor_id: tutorId,
        content: formData.content.trim(),
        topics_covered: formData.topics_covered,
        homework_assigned: formData.homework_assigned.trim() || null,
        student_performance: formData.student_performance || null,
        strengths: formData.strengths.trim() || null,
        areas_for_improvement: formData.areas_for_improvement.trim() || null,
        private_notes: formData.private_notes.trim() || null,
      }

      if (existingNote?.id) {
        // Update existing note
        const { error } = await supabase
          .from('session_notes')
          .update(noteData)
          .eq('id', existingNote.id)

        if (error) throw error
        toast.success('Session notes updated!')
      } else {
        // Create new note
        const { error } = await supabase
          .from('session_notes')
          .insert(noteData)

        if (error) throw error
        toast.success('Session notes saved!')
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving session notes:', error)
      toast.error(error.message || 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Session Notes */}
      <div>
        <label htmlFor="content" className="label">
          Session Summary *
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          className="input"
          placeholder="What did you cover in this session? How did it go?"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Topics Covered */}
      <div>
        <label className="label">Topics Covered</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTopic()
              }
            }}
            className="input"
            placeholder="Add a topic and press Enter"
          />
          <button
            type="button"
            onClick={addTopic}
            className="btn-secondary whitespace-nowrap"
          >
            Add Topic
          </button>
        </div>
        {formData.topics_covered.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.topics_covered.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(index)}
                  className="hover:text-primary-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Student Performance */}
      <div>
        <label htmlFor="performance" className="label">
          Student Performance
        </label>
        <select
          id="performance"
          value={formData.student_performance}
          onChange={(e) =>
            setFormData({ ...formData, student_performance: e.target.value })
          }
          className="input"
        >
          <option value="">Select performance level...</option>
          <option value="excellent">⭐ Excellent</option>
          <option value="good">👍 Good</option>
          <option value="satisfactory">✔️ Satisfactory</option>
          <option value="needs_improvement">📈 Needs Improvement</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Strengths */}
      <div>
        <label htmlFor="strengths" className="label">
          Strengths
        </label>
        <textarea
          id="strengths"
          value={formData.strengths}
          onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
          rows={3}
          className="input"
          placeholder="What did the student do well?"
        />
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Areas for Improvement */}
      <div>
        <label htmlFor="areas" className="label">
          Areas for Improvement
        </label>
        <textarea
          id="areas"
          value={formData.areas_for_improvement}
          onChange={(e) =>
            setFormData({ ...formData, areas_for_improvement: e.target.value })
          }
          rows={3}
          className="input"
          placeholder="What should the student focus on next?"
        />
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Homework Assigned */}
      <div>
        <label htmlFor="homework" className="label">
          Homework Assigned
        </label>
        <textarea
          id="homework"
          value={formData.homework_assigned}
          onChange={(e) =>
            setFormData({ ...formData, homework_assigned: e.target.value })
          }
          rows={3}
          className="input"
          placeholder="What should the student practice before the next session?"
        />
        <p className="text-xs text-gray-500 mt-1">
          Visible to student
        </p>
      </div>

      {/* Private Notes (Tutor Only) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <label htmlFor="private" className="label">
          🔒 Private Notes (Tutor Only)
        </label>
        <textarea
          id="private"
          value={formData.private_notes}
          onChange={(e) =>
            setFormData({ ...formData, private_notes: e.target.value })
          }
          rows={3}
          className="input"
          placeholder="Personal reminders, teaching strategies, etc. (not visible to student)"
        />
        <p className="text-xs text-yellow-700 mt-1">
          🔒 Only you can see this section
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !formData.content.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {existingNote?.id ? 'Update Notes' : 'Save Notes'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

