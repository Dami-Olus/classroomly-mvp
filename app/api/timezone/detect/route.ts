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

    // Update user's detected timezone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        detected_timezone: timezone,
        timezone_source: 'auto',
        timezone_last_updated: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update timezone:', updateError);
      return NextResponse.json({ error: 'Failed to update timezone' }, { status: 500 });
    }

    // Get timezone info
    const timezoneInfo = TimezoneDetector.getTimezoneInfo(timezone, 'auto');

    return NextResponse.json({ 
      success: true, 
      timezone,
      timezoneInfo 
    });
  } catch (error) {
    console.error('Timezone detection error:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's timezone info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('detected_timezone, timezone_override, timezone_source, timezone_last_updated')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get profile:', profileError);
      return NextResponse.json({ error: 'Failed to get timezone info' }, { status: 500 });
    }

    const currentTimezone = profile.timezone_override || profile.detected_timezone || 'UTC';
    const timezoneInfo = TimezoneDetector.getTimezoneInfo(currentTimezone, profile.timezone_source || 'default');

    return NextResponse.json({ 
      timezone: currentTimezone,
      timezoneInfo,
      profile
    });
  } catch (error) {
    console.error('Get timezone error:', error);
    return NextResponse.json({ error: 'Failed to get timezone' }, { status: 500 });
  }
}
