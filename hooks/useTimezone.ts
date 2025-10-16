/**
 * Timezone Management Hook
 * Provides timezone detection, conversion, and management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { TimezoneDetector, TimezoneInfo } from '@/lib/timezone/detection';
import { TimezoneConverter } from '@/lib/timezone/converter';

export interface UseTimezoneReturn {
  timezone: string;
  timezoneInfo: TimezoneInfo | null;
  loading: boolean;
  error: string | null;
  updateTimezone: (timezone: string) => Promise<void>;
  convertTime: (time: string, toTz?: string) => string;
  convertAvailability: (availability: any[], toTz?: string) => any[];
  isSameTimezone: (otherTz: string) => boolean;
  getTimezoneOffset: (otherTz: string) => number;
}

export function useTimezone(): UseTimezoneReturn {
  const [timezone, setTimezone] = useState<string>('UTC');
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect timezone on mount
  useEffect(() => {
    const detectTimezone = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const info = await TimezoneDetector.detectWithFallback();
        setTimezone(info.timezone);
        setTimezoneInfo(info);
        
        // Store in localStorage for persistence
        localStorage.setItem('user_timezone', info.timezone);
        localStorage.setItem('timezone_source', info.source);
      } catch (err) {
        console.error('Timezone detection failed:', err);
        setError('Failed to detect timezone');
        setTimezone('UTC');
        setTimezoneInfo(TimezoneDetector.getTimezoneInfo('UTC', 'default'));
      } finally {
        setLoading(false);
      }
    };

    // Check if we have a stored timezone
    const storedTimezone = localStorage.getItem('user_timezone');
    if (storedTimezone && TimezoneDetector.isValidTimezone(storedTimezone)) {
      setTimezone(storedTimezone);
      setTimezoneInfo(TimezoneDetector.getTimezoneInfo(storedTimezone, 'manual'));
      setLoading(false);
    } else {
      detectTimezone();
    }
  }, []);

  // Update timezone
  const updateTimezone = useCallback(async (newTimezone: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate timezone
      if (!TimezoneDetector.isValidTimezone(newTimezone)) {
        throw new Error('Invalid timezone');
      }

      // Update local state
      setTimezone(newTimezone);
      const info = TimezoneDetector.getTimezoneInfo(newTimezone, 'manual');
      setTimezoneInfo(info);

      // Store in localStorage
      localStorage.setItem('user_timezone', newTimezone);
      localStorage.setItem('timezone_source', 'manual');

      // Update in database if user is authenticated
      try {
        const response = await fetch('/api/timezone/set', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ timezone: newTimezone }),
        });

        if (!response.ok) {
          throw new Error('Failed to update timezone in database');
        }
      } catch (dbError) {
        console.warn('Failed to update timezone in database:', dbError);
        // Don't throw error - local storage is sufficient
      }
    } catch (err) {
      console.error('Failed to update timezone:', err);
      setError(err instanceof Error ? err.message : 'Failed to update timezone');
    } finally {
      setLoading(false);
    }
  }, []);

  // Convert time to another timezone
  const convertTime = useCallback((time: string, toTz?: string): string => {
    if (!toTz || TimezoneConverter.isSameTimezone(timezone, toTz)) {
      return time;
    }
    return TimezoneConverter.convertTime(time, timezone, toTz);
  }, [timezone]);

  // Convert availability to another timezone
  const convertAvailability = useCallback((availability: any[], toTz?: string): any[] => {
    if (!toTz || TimezoneConverter.isSameTimezone(timezone, toTz)) {
      return availability;
    }
    return TimezoneConverter.convertAvailability(availability, timezone, toTz);
  }, [timezone]);

  // Check if timezone is the same as another
  const isSameTimezone = useCallback((otherTz: string): boolean => {
    return TimezoneConverter.isSameTimezone(timezone, otherTz);
  }, [timezone]);

  // Get timezone offset
  const getTimezoneOffset = useCallback((otherTz: string): number => {
    return TimezoneConverter.getTimezoneOffset(timezone, otherTz);
  }, [timezone]);

  return {
    timezone,
    timezoneInfo,
    loading,
    error,
    updateTimezone,
    convertTime,
    convertAvailability,
    isSameTimezone,
    getTimezoneOffset,
  };
}

/**
 * Hook for timezone conversion between two specific timezones
 */
export function useTimezoneConversion(fromTz: string, toTz: string) {
  const [conversionInfo, setConversionInfo] = useState<{
    offset: number;
    offsetHours: number;
    offsetFormatted: string;
    isSame: boolean;
  } | null>(null);

  useEffect(() => {
    const offset = TimezoneConverter.getTimezoneOffset(fromTz, toTz);
    const offsetHours = TimezoneConverter.getTimezoneOffsetHours(fromTz, toTz);
    const offsetFormatted = TimezoneConverter.formatTimezoneOffset(offset);
    const isSame = TimezoneConverter.isSameTimezone(fromTz, toTz);

    setConversionInfo({
      offset,
      offsetHours,
      offsetFormatted,
      isSame,
    });
  }, [fromTz, toTz]);

  const convertTime = useCallback((time: string): string => {
    return TimezoneConverter.convertTime(time, fromTz, toTz);
  }, [fromTz, toTz]);

  const convertAvailability = useCallback((availability: any[]): any[] => {
    return TimezoneConverter.convertAvailability(availability, fromTz, toTz);
  }, [fromTz, toTz]);

  return {
    conversionInfo,
    convertTime,
    convertAvailability,
  };
}
