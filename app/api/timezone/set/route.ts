import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TimezoneDetector } from '@/lib/timezone/detection';

export async function POST(request: NextRequest) {
  try {
    const { timezone } = await request.json();
    
    // Validate timezone
    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    if (!TimezoneDetector.isValidTimezone(timezone)) {
      return NextResponse.json({ error: 'Invalid timezone format' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user's timezone override
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        timezone_override: timezone,
        timezone_source: 'manual',
        timezone_last_updated: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update timezone:', updateError);
      return NextResponse.json({ error: 'Failed to update timezone' }, { status: 500 });
    }

    // Get timezone info
    const timezoneInfo = TimezoneDetector.getTimezoneInfo(timezone, 'manual');

    return NextResponse.json({ 
      success: true, 
      timezone,
      timezoneInfo 
    });
  } catch (error) {
    console.error('Set timezone error:', error);
    return NextResponse.json({ error: 'Failed to set timezone' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove timezone override (fall back to detected timezone)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        timezone_override: null,
        timezone_source: 'auto',
        timezone_last_updated: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to reset timezone:', updateError);
      return NextResponse.json({ error: 'Failed to reset timezone' }, { status: 500 });
    }

    // Get current timezone (detected or default)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('detected_timezone, timezone')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get profile:', profileError);
      return NextResponse.json({ error: 'Failed to get timezone info' }, { status: 500 });
    }

    const currentTimezone = profile.detected_timezone || profile.timezone || 'UTC';
    const timezoneInfo = TimezoneDetector.getTimezoneInfo(currentTimezone, 'auto');

    return NextResponse.json({ 
      success: true, 
      timezone: currentTimezone,
      timezoneInfo 
    });
  } catch (error) {
    console.error('Reset timezone error:', error);
    return NextResponse.json({ error: 'Failed to reset timezone' }, { status: 500 });
  }
}
