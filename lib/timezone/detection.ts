/**
 * Timezone Detection Utilities
 * Handles automatic timezone detection and fallback mechanisms
 */

export interface TimezoneInfo {
  timezone: string;
  source: 'auto' | 'manual' | 'default';
  offset: number;
  name: string;
  abbreviation: string;
  isDST: boolean;
  utcOffset: string;
}

export class TimezoneDetector {
  /**
   * Detect user's timezone using browser APIs
   */
  static detect(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('Timezone detection failed:', error);
      return 'UTC';
    }
  }

  /**
   * Detect timezone with fallback mechanisms
   */
  static async detectWithFallback(): Promise<TimezoneInfo> {
    const detected = this.detect();
    
    if (detected && detected !== 'UTC') {
      return this.getTimezoneInfo(detected, 'auto');
    }
    
    // Fallback to IP-based detection
    try {
      const response = await fetch('/api/timezone/detect-ip');
      if (response.ok) {
        const data = await response.json();
        return this.getTimezoneInfo(data.timezone, 'auto');
      }
    } catch (error) {
      console.warn('IP-based timezone detection failed:', error);
    }
    
    // Final fallback to UTC
    return this.getTimezoneInfo('UTC', 'default');
  }

  /**
   * Get comprehensive timezone information
   */
  static getTimezoneInfo(timezone: string, source: 'auto' | 'manual' | 'default' = 'auto'): TimezoneInfo {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find(part => part.type === 'timeZoneName');
      const offset = this.getTimezoneOffset(timezone);
      
      return {
        timezone,
        source,
        offset,
        name: offsetPart?.value || timezone,
        abbreviation: this.getTimezoneAbbreviation(timezone),
        isDST: this.isDST(timezone),
        utcOffset: this.formatUTCOffset(offset)
      };
    } catch (error) {
      console.warn('Failed to get timezone info:', error);
      return {
        timezone,
        source,
        offset: 0,
        name: timezone,
        abbreviation: 'UTC',
        isDST: false,
        utcOffset: '+00:00'
      };
    }
  }

  /**
   * Get timezone offset in minutes
   */
  private static getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
      return (target.getTime() - utc.getTime()) / 60000;
    } catch {
      return 0;
    }
  }

  /**
   * Get timezone abbreviation
   */
  private static getTimezoneAbbreviation(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(new Date());
      return parts.find(part => part.type === 'timeZoneName')?.value || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  /**
   * Check if timezone is in daylight saving time
   */
  private static isDST(timezone: string): boolean {
    try {
      const jan = new Date(2024, 0, 1);
      const jul = new Date(2024, 6, 1);
      
      const janOffset = this.getTimezoneOffset(timezone);
      const julOffset = this.getTimezoneOffset(timezone);
      
      return janOffset !== julOffset;
    } catch {
      return false;
    }
  }

  /**
   * Format UTC offset as string
   */
  private static formatUTCOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Validate timezone string
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of common timezones
   */
  static getCommonTimezones(): string[] {
    return [
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
      'America/Vancouver',
      'Europe/Madrid',
      'Europe/Rome',
      'Asia/Dubai',
      'Asia/Singapore',
      'Pacific/Auckland'
    ];
  }
}
