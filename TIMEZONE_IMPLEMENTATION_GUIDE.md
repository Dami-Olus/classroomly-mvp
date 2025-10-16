# 🌍 Timezone Feature - Technical Implementation Guide

## 📋 Overview

This guide provides detailed technical implementation steps for the timezone management feature in ClassroomLY.

---

## 🏗️ Architecture Overview

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • TimezoneDetect│◄──►│ • TimezoneAPI   │◄──►│ • timezone cols │
│ • TimezoneUI    │    │ • Conversion    │    │ • timezone data │
│ • TimeDisplay   │    │ • Validation    │    │ • conversion    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🗄️ Database Schema Changes

### 1. Profile Table Updates

```sql
-- Add timezone fields to profiles table
ALTER TABLE profiles 
ADD COLUMN detected_timezone TEXT,
ADD COLUMN timezone_override TEXT,
ADD COLUMN timezone_source TEXT DEFAULT 'auto' CHECK (timezone_source IN ('auto', 'manual', 'default')),
ADD COLUMN timezone_last_updated TIMESTAMPTZ DEFAULT NOW();

-- Update existing profiles with detected timezone
UPDATE profiles 
SET detected_timezone = timezone,
    timezone_source = 'default'
WHERE detected_timezone IS NULL;
```

### 2. Tutor Availability Updates

```sql
-- Add timezone to tutor availability
ALTER TABLE tutors 
ADD COLUMN availability_timezone TEXT DEFAULT 'UTC';

-- Update existing availability with timezone
UPDATE tutors 
SET availability_timezone = (
  SELECT timezone FROM profiles WHERE id = tutors.user_id
)
WHERE availability_timezone IS NULL;
```

### 3. Session Timezone Tracking

```sql
-- Add timezone info to sessions
ALTER TABLE sessions 
ADD COLUMN tutor_timezone TEXT,
ADD COLUMN student_timezone TEXT,
ADD COLUMN converted_times JSONB;

-- Add timezone info to bookings
ALTER TABLE bookings 
ADD COLUMN student_timezone TEXT,
ADD COLUMN tutor_timezone TEXT;
```

---

## 🔧 Core Implementation

### 1. Timezone Detection Service

```typescript
// lib/timezone/detection.ts
export class TimezoneDetector {
  static detect(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('Timezone detection failed:', error);
      return 'UTC';
    }
  }

  static async detectWithFallback(): Promise<{
    timezone: string;
    source: 'auto' | 'manual' | 'default';
  }> {
    const detected = this.detect();
    
    if (detected && detected !== 'UTC') {
      return { timezone: detected, source: 'auto' };
    }
    
    // Fallback to IP-based detection
    try {
      const response = await fetch('/api/timezone/detect-ip');
      const data = await response.json();
      return { timezone: data.timezone, source: 'auto' };
    } catch {
      return { timezone: 'UTC', source: 'default' };
    }
  }
}
```

### 2. Timezone Conversion Engine

```typescript
// lib/timezone/converter.ts
import { DateTime } from 'luxon';

export class TimezoneConverter {
  static convertTime(
    time: string,
    fromTz: string,
    toTz: string
  ): string {
    try {
      const dt = DateTime.fromFormat(time, 'HH:mm', { zone: fromTz });
      const converted = dt.setZone(toTz);
      return converted.toFormat('HH:mm');
    } catch (error) {
      console.error('Timezone conversion failed:', error);
      return time; // Fallback to original time
    }
  }

  static convertAvailability(
    availability: TimeRange[],
    fromTz: string,
    toTz: string
  ): TimeRange[] {
    return availability.map(range => ({
      ...range,
      startTime: this.convertTime(range.startTime, fromTz, toTz),
      endTime: this.convertTime(range.endTime, fromTz, toTz),
      timezone: toTz
    }));
  }

  static getTimezoneInfo(timezone: string): TimezoneInfo {
    const dt = DateTime.now().setZone(timezone);
    return {
      timezone,
      offset: dt.offset,
      name: dt.offsetNameLong,
      abbreviation: dt.offsetNameShort,
      isDST: dt.isInDST,
      utcOffset: dt.toFormat('ZZ')
    };
  }
}
```

### 3. Timezone API Endpoints

```typescript
// app/api/timezone/detect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TimezoneDetector } from '@/lib/timezone/detection';

export async function POST(request: NextRequest) {
  try {
    const { timezone } = await request.json();
    
    // Validate timezone
    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    // Store in user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase
      .from('profiles')
      .update({
        detected_timezone: timezone,
        timezone_source: 'auto',
        timezone_last_updated: new Date().toISOString()
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true, timezone });
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
```

```typescript
// app/api/availability/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TimezoneConverter } from '@/lib/timezone/converter';

export async function POST(request: NextRequest) {
  try {
    const { availability, fromTz, toTz } = await request.json();
    
    const converted = TimezoneConverter.convertAvailability(
      availability,
      fromTz,
      toTz
    );

    return NextResponse.json({ converted });
  } catch (error) {
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}
```

---

## 🎨 Frontend Components

### 1. Timezone Detection Hook

```typescript
// hooks/useTimezone.ts
import { useState, useEffect } from 'react';
import { TimezoneDetector } from '@/lib/timezone/detection';

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>('UTC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectTimezone = async () => {
      try {
        setLoading(true);
        const { timezone: detected } = await TimezoneDetector.detectWithFallback();
        setTimezone(detected);
        setError(null);
      } catch (err) {
        setError('Failed to detect timezone');
        setTimezone('UTC');
      } finally {
        setLoading(false);
      }
    };

    detectTimezone();
  }, []);

  const updateTimezone = async (newTimezone: string) => {
    try {
      setLoading(true);
      // Update in database
      await fetch('/api/timezone/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: newTimezone })
      });
      setTimezone(newTimezone);
      setError(null);
    } catch (err) {
      setError('Failed to update timezone');
    } finally {
      setLoading(false);
    }
  };

  return { timezone, loading, error, updateTimezone };
}
```

### 2. Timezone Selector Component

```typescript
// components/TimezoneSelector.tsx
import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

const COMMON_TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'America/Toronto',
  'America/Vancouver'
];

export function TimezoneSelector({ value, onChange, disabled }: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
      >
        <div className="flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          <span>{value}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {COMMON_TIMEZONES.map((tz) => (
            <button
              key={tz}
              type="button"
              onClick={() => {
                onChange(tz);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                value === tz ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              {tz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Dual Timezone Display

```typescript
// components/DualTimeDisplay.tsx
import { TimezoneConverter } from '@/lib/timezone/converter';

interface DualTimeDisplayProps {
  time: string;
  fromTz: string;
  toTz: string;
  showLabels?: boolean;
}

export function DualTimeDisplay({ 
  time, 
  fromTz, 
  toTz, 
  showLabels = true 
}: DualTimeDisplayProps) {
  const convertedTime = TimezoneConverter.convertTime(time, fromTz, toTz);
  
  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        {showLabels && <span className="text-gray-500">Tutor: </span>}
        <span className="font-medium">{time}</span>
        <span className="text-gray-400 ml-1">({fromTz})</span>
      </div>
      <div className="text-gray-300">→</div>
      <div className="text-sm">
        {showLabels && <span className="text-gray-500">You: </span>}
        <span className="font-medium">{convertedTime}</span>
        <span className="text-gray-400 ml-1">({toTz})</span>
      </div>
    </div>
  );
}
```

---

## 🔄 Integration Points

### 1. Availability Page Integration

```typescript
// app/(dashboard)/tutor/availability/page.tsx (updated)
import { useTimezone } from '@/hooks/useTimezone';
import { TimezoneSelector } from '@/components/TimezoneSelector';

export default function AvailabilityPage() {
  const { timezone, updateTimezone } = useTimezone();
  const [availability, setAvailability] = useState<TimeRange[]>([]);

  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* Timezone Selector */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Your Timezone</h3>
        <TimezoneSelector
          value={timezone}
          onChange={updateTimezone}
        />
        <p className="text-sm text-gray-600 mt-2">
          Your availability will be set in this timezone. Students will see times converted to their timezone.
        </p>
      </div>

      {/* Existing availability selector */}
      <AvailabilitySelector
        availableSlots={availability}
        onChange={setAvailability}
      />
    </div>
  );
}
```

### 2. Booking Page Integration

```typescript
// app/book/[bookingLink]/page.tsx (updated)
import { useTimezone } from '@/hooks/useTimezone';
import { DualTimeDisplay } from '@/components/DualTimeDisplay';

export default function PublicBookingPage() {
  const { timezone: studentTz } = useTimezone();
  const [tutorTz, setTutorTz] = useState<string>('UTC');
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);

  // Load tutor timezone and convert slots
  useEffect(() => {
    if (classData?.tutor) {
      setTutorTz(classData.tutor.timezone || 'UTC');
      
      // Convert availability to student timezone
      const convertedSlots = availableSlots.map(slot => ({
        ...slot,
        time: TimezoneConverter.convertTime(slot.time, tutorTz, studentTz)
      }));
      setAvailableSlots(convertedSlots);
    }
  }, [classData, studentTz, tutorTz]);

  return (
    <div className="space-y-6">
      {/* Timezone Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Timezone Information</h3>
        <p className="text-sm text-blue-700">
          Times shown in your timezone ({studentTz}). 
          Tutor's timezone: {tutorTz}
        </p>
      </div>

      {/* Time slots with dual display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableSlots.map((slot) => (
          <div key={`${slot.day}-${slot.time}`} className="border rounded-lg p-4">
            <div className="font-medium">{slot.day}</div>
            <DualTimeDisplay
              time={slot.time}
              fromTz={tutorTz}
              toTz={studentTz}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Implementation

### 1. Unit Tests

```typescript
// __tests__/timezone/converter.test.ts
import { TimezoneConverter } from '@/lib/timezone/converter';

describe('TimezoneConverter', () => {
  test('converts time between timezones', () => {
    const result = TimezoneConverter.convertTime('14:00', 'Africa/Lagos', 'America/New_York');
    expect(result).toBe('08:00'); // 6 hour difference
  });

  test('handles DST transitions', () => {
    // Test during DST transition
    const result = TimezoneConverter.convertTime('14:00', 'Europe/London', 'America/New_York');
    // Should handle DST correctly
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  test('handles invalid timezone gracefully', () => {
    const result = TimezoneConverter.convertTime('14:00', 'Invalid/TZ', 'UTC');
    expect(result).toBe('14:00'); // Fallback to original
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/integration/timezone-booking.test.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { PublicBookingPage } from '@/app/book/[bookingLink]/page';

describe('Timezone Booking Integration', () => {
  test('displays times in student timezone', async () => {
    // Mock tutor in Nigeria (UTC+1)
    const mockClassData = {
      tutor: { timezone: 'Africa/Lagos' },
      duration: 60
    };

    // Mock student in Canada (UTC-5)
    Object.defineProperty(Intl, 'DateTimeFormat', {
      value: () => ({ resolvedOptions: () => ({ timeZone: 'America/Toronto' }) })
    });

    render(<PublicBookingPage />);
    
    // Should show times converted to student timezone
    expect(screen.getByText(/Your timezone: America\/Toronto/)).toBeInTheDocument();
  });
});
```

---

## 🚀 Deployment Strategy

### 1. Feature Flags

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  TIMEZONE_DETECTION: process.env.NEXT_PUBLIC_TIMEZONE_DETECTION === 'true',
  TIMEZONE_CONVERSION: process.env.NEXT_PUBLIC_TIMEZONE_CONVERSION === 'true',
  DUAL_TIMEZONE_DISPLAY: process.env.NEXT_PUBLIC_DUAL_TIMEZONE_DISPLAY === 'true'
};
```

### 2. Gradual Rollout

```typescript
// components/TimezoneFeature.tsx
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export function TimezoneFeature({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.TIMEZONE_DETECTION) {
    return <div>{children}</div>; // Fallback to original behavior
  }

  return <div>{children}</div>; // Enhanced with timezone features
}
```

### 3. Migration Script

```sql
-- Migration script for timezone feature
-- supabase/migrations/016_add_timezone_support.sql

-- Add timezone columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS detected_timezone TEXT,
ADD COLUMN IF NOT EXISTS timezone_override TEXT,
ADD COLUMN IF NOT EXISTS timezone_source TEXT DEFAULT 'auto';

-- Update existing data
UPDATE profiles 
SET detected_timezone = timezone,
    timezone_source = 'default'
WHERE detected_timezone IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON profiles(detected_timezone);
CREATE INDEX IF NOT EXISTS idx_tutors_availability_timezone ON tutors(availability_timezone);
```

---

## 📊 Monitoring & Analytics

### 1. Timezone Usage Tracking

```typescript
// lib/analytics/timezone.ts
import { Analytics } from '@/lib/analytics';

export class TimezoneAnalytics {
  static trackTimezoneDetection(timezone: string, source: string) {
    Analytics.track('timezone_detected', {
      timezone,
      source,
      timestamp: new Date().toISOString()
    });
  }

  static trackTimezoneConversion(fromTz: string, toTz: string) {
    Analytics.track('timezone_conversion', {
      from_timezone: fromTz,
      to_timezone: toTz,
      timestamp: new Date().toISOString()
    });
  }

  static trackTimezoneError(error: string, context: string) {
    Analytics.track('timezone_error', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Performance Monitoring

```typescript
// lib/timezone/performance.ts
export class TimezonePerformance {
  static measureConversion<T>(
    fn: () => T,
    context: string
  ): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`Timezone conversion (${context}): ${end - start}ms`);
    
    return result;
  }
}
```

---

## 🎯 Success Metrics Implementation

### 1. Error Tracking

```typescript
// lib/timezone/error-tracking.ts
export class TimezoneErrorTracker {
  static trackBookingError(error: Error, context: any) {
    // Track timezone-related booking errors
    if (error.message.includes('timezone') || error.message.includes('time')) {
      Analytics.track('timezone_booking_error', {
        error: error.message,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

### 2. User Satisfaction

```typescript
// components/TimezoneFeedback.tsx
export function TimezoneFeedback() {
  const [feedback, setFeedback] = useState<string>('');

  const submitFeedback = async (rating: number) => {
    await Analytics.track('timezone_feedback', {
      rating,
      feedback,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      <h3>How was your timezone experience?</h3>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => submitFeedback(rating)}
            className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 Development Commands

### 1. Setup Commands

```bash
# Install timezone libraries
npm install luxon @types/luxon

# Run timezone tests
npm run test:timezone

# Run timezone migration
npm run db:migrate:timezone
```

### 2. Testing Commands

```bash
# Test timezone conversion
npm run test:timezone:conversion

# Test timezone detection
npm run test:timezone:detection

# Test cross-timezone booking
npm run test:timezone:booking
```

---

## 📚 Documentation

### 1. API Documentation

```typescript
/**
 * Timezone API Documentation
 * 
 * @endpoint POST /api/timezone/detect
 * @description Detect user timezone automatically
 * @body { timezone: string }
 * @response { success: boolean, timezone: string }
 * 
 * @endpoint POST /api/timezone/set
 * @description Set user timezone manually
 * @body { timezone: string }
 * @response { success: boolean, timezone: string }
 * 
 * @endpoint POST /api/availability/convert
 * @description Convert availability between timezones
 * @body { availability: TimeRange[], fromTz: string, toTz: string }
 * @response { converted: TimeRange[] }
 */
```

### 2. Component Documentation

```typescript
/**
 * TimezoneSelector Component
 * 
 * @props value: string - Current timezone
 * @props onChange: (timezone: string) => void - Timezone change handler
 * @props disabled?: boolean - Disable selector
 * 
 * @example
 * <TimezoneSelector
 *   value="Africa/Lagos"
 *   onChange={(tz) => setTimezone(tz)}
 * />
 */
```

---

## 🎉 Conclusion

This implementation guide provides a complete technical roadmap for implementing timezone management in ClassroomLY. The modular approach ensures maintainability, while comprehensive testing guarantees reliability across different timezones and edge cases.

The implementation follows best practices for:
- **Performance** optimization
- **Error handling** and fallbacks
- **User experience** enhancement
- **Testing** coverage
- **Monitoring** and analytics

By following this guide, the timezone feature will provide a seamless experience for global users while maintaining the simplicity that makes ClassroomLY effective.
