/**
 * Timezone Detection Tests
 * Tests the timezone detection functionality
 */

import { TimezoneDetector } from '@/lib/timezone/detection';

// Mock Intl.DateTimeFormat for testing
const mockIntl = {
  DateTimeFormat: jest.fn(() => ({
    resolvedOptions: () => ({ timeZone: 'Africa/Lagos' })
  }))
};

// @ts-ignore
global.Intl = mockIntl;

describe('TimezoneDetector', () => {
  describe('detect', () => {
    test('detects timezone from browser', () => {
      const timezone = TimezoneDetector.detect();
      expect(timezone).toBe('Africa/Lagos');
    });

    test('handles detection failure gracefully', () => {
      // Mock failure
      const originalIntl = global.Intl;
      // @ts-ignore
      global.Intl = {
        DateTimeFormat: jest.fn(() => {
          throw new Error('Detection failed');
        })
      };

      const timezone = TimezoneDetector.detect();
      expect(timezone).toBe('UTC');

      // Restore
      global.Intl = originalIntl;
    });
  });

  describe('getTimezoneInfo', () => {
    test('gets timezone information', () => {
      const info = TimezoneDetector.getTimezoneInfo('Africa/Lagos', 'auto');
      
      expect(info.timezone).toBe('Africa/Lagos');
      expect(info.source).toBe('auto');
      expect(info.name).toBeDefined();
      expect(info.abbreviation).toBeDefined();
    });

    test('handles invalid timezone', () => {
      const info = TimezoneDetector.getTimezoneInfo('Invalid/TZ', 'manual');
      
      expect(info.timezone).toBe('Invalid/TZ');
      expect(info.source).toBe('manual');
      expect(info.offset).toBe(0);
    });
  });

  describe('isValidTimezone', () => {
    test('validates correct timezone', () => {
      expect(TimezoneDetector.isValidTimezone('Africa/Lagos')).toBe(true);
      expect(TimezoneDetector.isValidTimezone('America/New_York')).toBe(true);
      expect(TimezoneDetector.isValidTimezone('UTC')).toBe(true);
    });

    test('rejects invalid timezone', () => {
      expect(TimezoneDetector.isValidTimezone('Invalid/TZ')).toBe(false);
      expect(TimezoneDetector.isValidTimezone('')).toBe(false);
      expect(TimezoneDetector.isValidTimezone('NotATimezone')).toBe(false);
    });
  });

  describe('getCommonTimezones', () => {
    test('returns list of common timezones', () => {
      const timezones = TimezoneDetector.getCommonTimezones();
      
      expect(timezones).toContain('UTC');
      expect(timezones).toContain('Africa/Lagos');
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('Europe/London');
      expect(timezones.length).toBeGreaterThan(10);
    });
  });
});
