-- Sprint 5 Feature 1: Session Materials
-- Allow tutors and students to upload and share files for tutoring sessions

-- Create session_materials table
CREATE TABLE IF NOT EXISTS session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  file_type TEXT, -- pdf, doc, image, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_booking ON session_materials(booking_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader ON session_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_created ON session_materials(created_at DESC);

-- Enable RLS
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Booking participants (tutor and student) can view materials
CREATE POLICY "Booking participants can view materials" ON session_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = session_materials.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Both tutor and student can upload materials
CREATE POLICY "Participants can upload materials" ON session_materials
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = session_materials.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Only the uploader can delete their own materials
CREATE POLICY "Uploader can delete materials" ON session_materials
  FOR DELETE USING (uploaded_by = auth.uid());

-- Comments
COMMENT ON TABLE session_materials IS 'Files and materials shared between tutor and student for specific bookings';
COMMENT ON COLUMN session_materials.file_url IS 'Supabase Storage URL for the uploaded file';
COMMENT ON COLUMN session_materials.file_size IS 'File size in bytes for display and validation';
COMMENT ON COLUMN session_materials.file_type IS 'MIME type or file extension for icon display';

-- Create storage bucket for materials (run this in Supabase Dashboard)
-- Storage bucket: 'materials'
-- Public: false (only accessible via RLS)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.*, text/*

