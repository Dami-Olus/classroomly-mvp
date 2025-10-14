'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClassNotesFormProps {
  classId: string
  tutorId: string
  existingNotes?: any
  onSave: () => void
  onCancel: () => void
}

export default function ClassNotesForm({ classId, tutorId, existingNotes, onSave, onCancel }: ClassNotesFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    student_background: existingNotes?.student_background || '',
    learning_style: existingNotes?.learning_style || '',
    goals: existingNotes?.goals || '',
    parent_contact: existingNotes?.parent_contact || '',
    special_considerations: existingNotes?.special_considerations || '',
    overall_notes: existingNotes?.overall_notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (existingNotes) {
        // Update existing notes
        const { error } = await supabase
          .from('class_notes')
          .update(formData)
          .eq('id', existingNotes.id)

        if (error) throw error
        toast.success('Class notes updated successfully')
      } else {
        // Create new notes
        const { error } = await supabase
          .from('class_notes')
          .insert({
            class_id: classId,
            tutor_id: tutorId,
            ...formData,
          })

        if (error) throw error
        toast.success('Class notes saved successfully')
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving class notes:', error)
      toast.error(error.message || 'Failed to save class notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Student Background</label>
        <textarea
          value={formData.student_background}
          onChange={(e) => setFormData({ ...formData, student_background: e.target.value })}
          className="input"
          rows={3}
          placeholder="Student's academic background, current grade level, previous experience..."
        />
      </div>

      <div>
        <label className="label">Learning Style</label>
        <textarea
          value={formData.learning_style}
          onChange={(e) => setFormData({ ...formData, learning_style: e.target.value })}
          className="input"
          rows={3}
          placeholder="How does the student learn best? Visual, auditory, kinesthetic? Preferred teaching methods..."
        />
      </div>

      <div>
        <label className="label">Goals</label>
        <textarea
          value={formData.goals}
          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          className="input"
          rows={3}
          placeholder="What are the student's learning goals? Exam preparation, skill improvement, etc..."
        />
      </div>

      <div>
        <label className="label">Parent/Guardian Contact</label>
        <textarea
          value={formData.parent_contact}
          onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
          className="input"
          rows={2}
          placeholder="Parent/guardian name, phone number, preferred contact method..."
        />
      </div>

      <div>
        <label className="label">Special Considerations</label>
        <textarea
          value={formData.special_considerations}
          onChange={(e) => setFormData({ ...formData, special_considerations: e.target.value })}
          className="input"
          rows={3}
          placeholder="Any special needs, accommodations, medical considerations, behavioral notes..."
        />
      </div>

      <div>
        <label className="label">Overall Notes</label>
        <textarea
          value={formData.overall_notes}
          onChange={(e) => setFormData({ ...formData, overall_notes: e.target.value })}
          className="input"
          rows={4}
          placeholder="Any other important information about this class..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Class Notes'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}

