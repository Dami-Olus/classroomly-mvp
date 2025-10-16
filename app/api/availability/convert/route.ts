import { NextRequest, NextResponse } from 'next/server';
import { TimezoneConverter } from '@/lib/timezone/converter';

export async function POST(request: NextRequest) {
  try {
    const { availability, fromTz, toTz } = await request.json();
    
    // Validate input
    if (!availability || !Array.isArray(availability)) {
      return NextResponse.json({ error: 'Invalid availability data' }, { status: 400 });
    }

    if (!fromTz || !toTz) {
      return NextResponse.json({ error: 'Missing timezone parameters' }, { status: 400 });
    }

    if (typeof fromTz !== 'string' || typeof toTz !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone format' }, { status: 400 });
    }

    // Convert availability
    const converted = TimezoneConverter.convertAvailability(availability, fromTz, toTz);
    
    // Get conversion info
    const conversionInfo = {
      from: fromTz,
      to: toTz,
      offset: TimezoneConverter.getTimezoneOffset(fromTz, toTz),
      offsetHours: TimezoneConverter.getTimezoneOffsetHours(fromTz, toTz),
      offsetFormatted: TimezoneConverter.formatTimezoneOffset(
        TimezoneConverter.getTimezoneOffset(fromTz, toTz)
      ),
      isSameTimezone: TimezoneConverter.isSameTimezone(fromTz, toTz)
    };

    return NextResponse.json({ 
      converted,
      conversionInfo,
      original: availability
    });
  } catch (error) {
    console.error('Availability conversion error:', error);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromTz = searchParams.get('from');
    const toTz = searchParams.get('to');

    if (!fromTz || !toTz) {
      return NextResponse.json({ error: 'Missing timezone parameters' }, { status: 400 });
    }

    // Get conversion info
    const conversionInfo = {
      from: fromTz,
      to: toTz,
      offset: TimezoneConverter.getTimezoneOffset(fromTz, toTz),
      offsetHours: TimezoneConverter.getTimezoneOffsetHours(fromTz, toTz),
      offsetFormatted: TimezoneConverter.formatTimezoneOffset(
        TimezoneConverter.getTimezoneOffset(fromTz, toTz)
      ),
      isSameTimezone: TimezoneConverter.isSameTimezone(fromTz, toTz)
    };

    return NextResponse.json({ conversionInfo });
  } catch (error) {
    console.error('Get conversion info error:', error);
    return NextResponse.json({ error: 'Failed to get conversion info' }, { status: 500 });
  }
}
