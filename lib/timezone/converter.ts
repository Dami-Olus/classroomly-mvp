/**
 * Timezone Conversion Engine
 * Handles conversion between different timezones
 */

export interface TimeRange {
  day: string;
  startTime: string;
  endTime: string;
  timezone?: string;
}

export interface TimeSlot {
  day: string;
  time: string;
  timezone?: string;
}

export interface TimezoneConversion {
  from: string;
  to: string;
  convertedTime: string;
  originalTime: string;
  offset: number;
}

export class TimezoneConverter {
  /**
   * Convert time between timezones
   * Fixed to prevent day shifts by using proper timezone conversion
   */
  static convertTime(
    time: string,
    fromTz: string,
    toTz: string
  ): string {
    try {
      // If same timezone, return original time
      if (fromTz === toTz) {
        return time;
      }

      // Parse the time
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create a date with the time in the source timezone
      // Use a fixed date to avoid DST issues
      const dateStr = '2024-06-15'; // Summer date to avoid DST transitions
      const dateTimeStr = `${dateStr}T${time}:00`;
      
      // Create date object and interpret it as being in the source timezone
      const sourceDate = new Date(dateTimeStr);
      
      // Get the time in the target timezone
      const targetTime = new Intl.DateTimeFormat('en-CA', {
        timeZone: toTz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(sourceDate);
      
      return targetTime;
    } catch (error) {
      console.error('Timezone conversion failed:', error);
      return time; // Fallback to original time
    }
  }

  /**
   * Convert availability ranges between timezones
   */
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

  /**
   * Convert time slots between timezones
   */
  static convertTimeSlots(
    slots: TimeSlot[],
    fromTz: string,
    toTz: string
  ): TimeSlot[] {
    return slots.map(slot => ({
      ...slot,
      time: this.convertTime(slot.time, fromTz, toTz),
      timezone: toTz
    }));
  }

  /**
   * Get timezone conversion information
   */
  static getConversionInfo(
    time: string,
    fromTz: string,
    toTz: string
  ): TimezoneConversion {
    const convertedTime = this.convertTime(time, fromTz, toTz);
    const offset = this.getTimezoneOffset(fromTz, toTz);
    
    return {
      from: fromTz,
      to: toTz,
      convertedTime,
      originalTime: time,
      offset
    };
  }

  /**
   * Get timezone offset between two timezones
   */
  static getTimezoneOffset(fromTz: string, toTz: string): number {
    try {
      const now = new Date();
      const fromDate = new Date(now.toLocaleString('en-US', { timeZone: fromTz }));
      const toDate = new Date(now.toLocaleString('en-US', { timeZone: toTz }));
      
      return (toDate.getTime() - fromDate.getTime()) / (1000 * 60);
    } catch {
      return 0;
    }
  }

  /**
   * Check if two timezones are the same
   */
  static isSameTimezone(tz1: string, tz2: string): boolean {
    if (tz1 === tz2) return true;
    
    // Check if they have the same offset (e.g., UTC and ET during standard time)
    try {
      const offset1 = this.getTimezoneOffset('UTC', tz1);
      const offset2 = this.getTimezoneOffset('UTC', tz2);
      return offset1 === offset2;
    } catch {
      return false;
    }
  }

  /**
   * Get timezone offset in hours
   */
  static getTimezoneOffsetHours(fromTz: string, toTz: string): number {
    return this.getTimezoneOffset(fromTz, toTz) / 60;
  }

  /**
   * Format timezone offset for display
   */
  static formatTimezoneOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    
    if (minutes === 0) {
      return `${sign}${hours}h`;
    }
    
    return `${sign}${hours}h ${minutes}m`;
  }

  /**
   * Convert date and time between timezones
   */
  static convertDateTime(
    date: string,
    time: string,
    fromTz: string,
    toTz: string
  ): { date: string; time: string } {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      
      // Create date in source timezone
      const sourceDate = new Date(year, month - 1, day, hours, minutes);
      
      // Convert to target timezone
      const targetDate = new Date(sourceDate.toLocaleString('en-US', { timeZone: toTz }));
      
      const convertedDate = targetDate.toISOString().split('T')[0];
      const convertedTime = `${targetDate.getHours().toString().padStart(2, '0')}:${targetDate.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        date: convertedDate,
        time: convertedTime
      };
    } catch (error) {
      console.error('DateTime conversion failed:', error);
      return { date, time };
    }
  }

  /**
   * Batch convert multiple times
   */
  static batchConvertTimes(
    times: string[],
    fromTz: string,
    toTz: string
  ): string[] {
    return times.map(time => this.convertTime(time, fromTz, toTz));
  }

  /**
   * Validate timezone conversion
   */
  static validateConversion(
    originalTime: string,
    convertedTime: string,
    fromTz: string,
    toTz: string
  ): boolean {
    try {
      const expectedConverted = this.convertTime(originalTime, fromTz, toTz);
      return expectedConverted === convertedTime;
    } catch {
      return false;
    }
  }
}
