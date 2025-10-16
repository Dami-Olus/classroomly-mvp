/**
 * Timezone Converter Tests
 * Tests the core timezone conversion functionality
 */

import { TimezoneConverter } from '@/lib/timezone/converter';

describe('TimezoneConverter', () => {
  describe('convertTime', () => {
    test('converts time between different timezones', () => {
      // Test Nigeria (UTC+1) to New York (UTC-5) - 6 hour difference
      const result = TimezoneConverter.convertTime('14:00', 'Africa/Lagos', 'America/New_York');
      expect(result).toBe('08:00');
    });

    test('handles same timezone', () => {
      const result = TimezoneConverter.convertTime('14:00', 'UTC', 'UTC');
      expect(result).toBe('14:00');
    });

    test('handles invalid timezone gracefully', () => {
      const result = TimezoneConverter.convertTime('14:00', 'Invalid/TZ', 'UTC');
      expect(result).toBe('14:00'); // Should fallback to original time
    });
  });

  describe('convertAvailability', () => {
    test('converts availability ranges between timezones', () => {
      const availability = [
        { day: 'Monday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '14:00', endTime: '18:00' }
      ];

      const converted = TimezoneConverter.convertAvailability(
        availability,
        'Africa/Lagos',
        'America/New_York'
      );

      expect(converted).toHaveLength(2);
      expect(converted[0].day).toBe('Monday');
      expect(converted[0].timezone).toBe('America/New_York');
    });
  });

  describe('getTimezoneOffset', () => {
    test('calculates timezone offset correctly', () => {
      const offset = TimezoneConverter.getTimezoneOffset('Africa/Lagos', 'America/New_York');
      expect(offset).toBe(-360); // 6 hours in minutes
    });

    test('handles same timezone', () => {
      const offset = TimezoneConverter.getTimezoneOffset('UTC', 'UTC');
      expect(offset).toBe(0);
    });
  });

  describe('isSameTimezone', () => {
    test('detects same timezone', () => {
      expect(TimezoneConverter.isSameTimezone('UTC', 'UTC')).toBe(true);
    });

    test('detects different timezones', () => {
      expect(TimezoneConverter.isSameTimezone('Africa/Lagos', 'America/New_York')).toBe(false);
    });
  });

  describe('formatTimezoneOffset', () => {
    test('formats positive offset', () => {
      const formatted = TimezoneConverter.formatTimezoneOffset(120);
      expect(formatted).toBe('+2h');
    });

    test('formats negative offset', () => {
      const formatted = TimezoneConverter.formatTimezoneOffset(-360);
      expect(formatted).toBe('-6h');
    });

    test('formats offset with minutes', () => {
      const formatted = TimezoneConverter.formatTimezoneOffset(90);
      expect(formatted).toBe('+1h 30m');
    });
  });
});
