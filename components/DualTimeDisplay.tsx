'use client';

import { TimezoneConverter } from '@/lib/timezone/converter';
import { Clock, ArrowRight } from 'lucide-react';

interface DualTimeDisplayProps {
  time: string;
  fromTz: string;
  toTz: string;
  showLabels?: boolean;
  showOffset?: boolean;
  className?: string;
  compact?: boolean;
}

export function DualTimeDisplay({ 
  time, 
  fromTz, 
  toTz, 
  showLabels = true,
  showOffset = true,
  className = '',
  compact = false
}: DualTimeDisplayProps) {
  const convertedTime = TimezoneConverter.convertTime(time, fromTz, toTz);
  const isSameTimezone = TimezoneConverter.isSameTimezone(fromTz, toTz);
  const offset = TimezoneConverter.getTimezoneOffset(fromTz, toTz);
  const offsetFormatted = TimezoneConverter.formatTimezoneOffset(offset);

  if (isSameTimezone) {
    return (
      <div className={`flex items-center text-sm text-gray-600 ${className}`}>
        <Clock className="w-4 h-4 mr-1" />
        <span>{time}</span>
        <span className="ml-1 text-gray-400">(same timezone)</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center text-sm ${className}`}>
        <span className="font-medium">{convertedTime}</span>
        {showOffset && (
          <span className="ml-1 text-gray-400 text-xs">
            ({offsetFormatted})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-sm">
        {showLabels && <span className="text-gray-500">Tutor: </span>}
        <span className="font-medium">{time}</span>
        <span className="text-gray-400 ml-1 text-xs">({fromTz})</span>
      </div>
      
      <ArrowRight className="w-3 h-3 text-gray-300" />
      
      <div className="text-sm">
        {showLabels && <span className="text-gray-500">You: </span>}
        <span className="font-medium text-blue-600">{convertedTime}</span>
        <span className="text-gray-400 ml-1 text-xs">({toTz})</span>
      </div>
      
      {showOffset && (
        <span className="text-xs text-gray-400">
          {offsetFormatted}
        </span>
      )}
    </div>
  );
}

/**
 * Timezone info display component
 */
interface TimezoneInfoDisplayProps {
  timezone: string;
  showDetails?: boolean;
  className?: string;
}

export function TimezoneInfoDisplay({ 
  timezone, 
  showDetails = false,
  className = ''
}: TimezoneInfoDisplayProps) {
  const getTimezoneDisplayName = (tz: string): string => {
    const displayNames: Record<string, string> = {
      'UTC': 'UTC',
      'Africa/Lagos': 'Lagos, Nigeria',
      'America/New_York': 'New York, USA',
      'America/Chicago': 'Chicago, USA',
      'America/Denver': 'Denver, USA',
      'America/Los_Angeles': 'Los Angeles, USA',
      'Europe/London': 'London, UK',
      'Europe/Paris': 'Paris, France',
      'Europe/Berlin': 'Berlin, Germany',
      'Asia/Tokyo': 'Tokyo, Japan',
      'Asia/Shanghai': 'Shanghai, China',
      'Asia/Kolkata': 'Mumbai, India',
      'Australia/Sydney': 'Sydney, Australia',
      'America/Toronto': 'Toronto, Canada',
      'America/Vancouver': 'Vancouver, Canada',
    };
    
    return displayNames[tz] || tz;
  };

  return (
    <div className={`flex items-center text-sm ${className}`}>
      <Clock className="w-4 h-4 mr-2 text-gray-500" />
      <span className="text-gray-700">{getTimezoneDisplayName(timezone)}</span>
      {showDetails && (
        <span className="ml-2 text-gray-400 text-xs">({timezone})</span>
      )}
    </div>
  );
}

/**
 * Timezone conversion info component
 */
interface TimezoneConversionInfoProps {
  fromTz: string;
  toTz: string;
  className?: string;
}

export function TimezoneConversionInfo({ 
  fromTz, 
  toTz, 
  className = '' 
}: TimezoneConversionInfoProps) {
  const isSameTimezone = TimezoneConverter.isSameTimezone(fromTz, toTz);
  const offset = TimezoneConverter.getTimezoneOffset(fromTz, toTz);
  const offsetFormatted = TimezoneConverter.formatTimezoneOffset(offset);

  if (isSameTimezone) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        Same timezone - no conversion needed
      </div>
    );
  }

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <span className="font-medium">{fromTz}</span>
      <span className="mx-2">→</span>
      <span className="font-medium">{toTz}</span>
      <span className="ml-2 text-gray-400">({offsetFormatted})</span>
    </div>
  );
}

/**
 * Time slot with timezone display
 */
interface TimeSlotWithTimezoneProps {
  day: string;
  time: string;
  fromTz: string;
  toTz: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TimeSlotWithTimezone({ 
  day, 
  time, 
  fromTz, 
  toTz, 
  selected = false,
  onClick,
  className = ''
}: TimeSlotWithTimezoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-3 border rounded-lg text-left transition-colors ${
        selected 
          ? 'border-blue-500 bg-blue-50 text-blue-700' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${className}`}
    >
      <div className="font-medium text-sm">{day}</div>
      <DualTimeDisplay
        time={time}
        fromTz={fromTz}
        toTz={toTz}
        showLabels={false}
        showOffset={true}
        className="mt-1"
      />
    </button>
  );
}
