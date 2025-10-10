-- Classroomly MVP Database Schema
-- Sprint 1: Foundation & Authentication

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('tutor', 'student', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled');
CREATE TYPE classroom_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE message_type AS ENUM ('text', 'file', 'system');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  profile_image TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutor profiles table
CREATE TABLE tutors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  expertise TEXT[] DEFAULT '{}',
  education TEXT,
  experience TEXT,
  hourly_rate DECIMAL(10, 2),
  availability JSONB,
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL CHECK (duration IN (30, 60, 120)),
  weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency >= 1 AND weekly_frequency <= 7),
  price_per_session DECIMAL(10, 2),
  available_slots JSONB NOT NULL DEFAULT '[]',
  booking_link TEXT UNIQUE NOT NULL,
  max_students INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  scheduled_slots JSONB NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_sessions INTEGER NOT NULL,
  completed_sessions INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms table
CREATE TABLE classrooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  room_url TEXT UNIQUE NOT NULL,
  video_co_room_id TEXT,
  status classroom_status NOT NULL DEFAULT 'scheduled',
  joined_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type message_type NOT NULL DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  uploader_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tutors_user_id ON tutors(user_id);
CREATE INDEX idx_classes_tutor_id ON classes(tutor_id);
CREATE INDEX idx_classes_booking_link ON classes(booking_link);
CREATE INDEX idx_bookings_class_id ON bookings(class_id);
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_classrooms_booking_id ON classrooms(booking_id);
CREATE INDEX idx_classrooms_room_url ON classrooms(room_url);
CREATE INDEX idx_messages_classroom_id ON messages(classroom_id);
CREATE INDEX idx_materials_classroom_id ON materials(classroom_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tutors RLS Policies
CREATE POLICY "Tutor profiles are viewable by everyone"
  ON tutors FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Tutors can update own profile"
  ON tutors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Tutors can create own profile"
  ON tutors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Classes RLS Policies
CREATE POLICY "Active classes are viewable by everyone"
  ON classes FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Tutors can manage own classes"
  ON classes FOR ALL
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- Bookings RLS Policies
CREATE POLICY "Bookings are viewable by tutor and student"
  ON bookings FOR SELECT
  USING (
    student_id = auth.uid() OR
    class_id IN (
      SELECT c.id FROM classes c
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create a booking"
  ON bookings FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Tutor and student can update bookings"
  ON bookings FOR UPDATE
  USING (
    student_id = auth.uid() OR
    class_id IN (
      SELECT c.id FROM classes c
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- Classrooms RLS Policies
CREATE POLICY "Classroom participants can view"
  ON classrooms FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Classroom participants can update"
  ON classrooms FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

-- Messages RLS Policies
CREATE POLICY "Classroom participants can view messages"
  ON messages FOR SELECT
  USING (
    classroom_id IN (
      SELECT cr.id FROM classrooms cr
      JOIN bookings b ON b.id = cr.booking_id
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Classroom participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    classroom_id IN (
      SELECT cr.id FROM classrooms cr
      JOIN bookings b ON b.id = cr.booking_id
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

-- Materials RLS Policies
CREATE POLICY "Classroom participants can view materials"
  ON materials FOR SELECT
  USING (
    classroom_id IN (
      SELECT cr.id FROM classrooms cr
      JOIN bookings b ON b.id = cr.booking_id
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Classroom participants can upload materials"
  ON materials FOR INSERT
  WITH CHECK (
    uploader_id = auth.uid() AND
    classroom_id IN (
      SELECT cr.id FROM classrooms cr
      JOIN bookings b ON b.id = cr.booking_id
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own materials"
  ON materials FOR DELETE
  USING (uploader_id = auth.uid());

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

