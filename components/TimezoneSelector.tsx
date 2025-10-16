'use client';

import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import { TimezoneDetector } from '@/lib/timezone/detection';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
  className?: string;
  showCommonOnly?: boolean;
}

export function TimezoneSelector({ 
  value, 
  onChange, 
  disabled = false, 
  className = '',
  showCommonOnly = true 
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timezones, setTimezones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load timezones on mount
  useEffect(() => {
    const loadTimezones = async () => {
      setLoading(true);
      try {
        if (showCommonOnly) {
          setTimezones(TimezoneDetector.getCommonTimezones());
        } else {
          // Load all timezones (this would be a more comprehensive list)
          setTimezones(TimezoneDetector.getCommonTimezones());
        }
      } catch (error) {
        console.error('Failed to load timezones:', error);
        setTimezones(TimezoneDetector.getCommonTimezones());
      } finally {
        setLoading(false);
      }
    };

    loadTimezones();
  }, [showCommonOnly]);

  // Filter timezones based on search term
  const filteredTimezones = timezones.filter(tz =>
    tz.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getTimezoneDisplayName = (tz: string): string => {
    if (tz === 'UTC') return 'UTC (Coordinated Universal Time)';
    if (tz === 'Africa/Lagos') return 'Lagos, Nigeria (WAT)';
    if (tz === 'America/New_York') return 'New York, USA (EST/EDT)';
    if (tz === 'America/Chicago') return 'Chicago, USA (CST/CDT)';
    if (tz === 'America/Denver') return 'Denver, USA (MST/MDT)';
    if (tz === 'America/Los_Angeles') return 'Los Angeles, USA (PST/PDT)';
    if (tz === 'Europe/London') return 'London, UK (GMT/BST)';
    if (tz === 'Europe/Paris') return 'Paris, France (CET/CEST)';
    if (tz === 'Europe/Berlin') return 'Berlin, Germany (CET/CEST)';
    if (tz === 'Asia/Tokyo') return 'Tokyo, Japan (JST)';
    if (tz === 'Asia/Shanghai') return 'Shanghai, China (CST)';
    if (tz === 'Asia/Kolkata') return 'Mumbai, India (IST)';
    if (tz === 'Australia/Sydney') return 'Sydney, Australia (AEST/AEDT)';
    if (tz === 'America/Toronto') return 'Toronto, Canada (EST/EDT)';
    if (tz === 'America/Vancouver') return 'Vancouver, Canada (PST/PDT)';
    
    return tz;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center">
          <Globe className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-900">{getTimezoneDisplayName(value)}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search timezones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Timezone list */}
          <div className="max-h-48 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading timezones...</span>
              </div>
            ) : filteredTimezones.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No timezones found
              </div>
            ) : (
              filteredTimezones.map((tz) => (
                <button
                  key={tz}
                  type="button"
                  onClick={() => handleSelect(tz)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    value === tz ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  <span>{getTimezoneDisplayName(tz)}</span>
                  {value === tz && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact timezone selector for forms
 */
export function CompactTimezoneSelector({ 
  value, 
  onChange, 
  disabled = false 
}: Omit<TimezoneSelectorProps, 'className' | 'showCommonOnly'>) {
  return (
    <TimezoneSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full"
      showCommonOnly={true}
    />
  );
}

/**
 * Timezone selector with auto-detection
 */
export function AutoTimezoneSelector({ 
  value, 
  onChange, 
  disabled = false 
}: Omit<TimezoneSelectorProps, 'className' | 'showCommonOnly'>) {
  const [detecting, setDetecting] = useState(false);

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const detected = TimezoneDetector.detect();
      if (detected && detected !== 'UTC') {
        onChange(detected);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-2">
      <TimezoneSelector
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full"
        showCommonOnly={true}
      />
      <button
        type="button"
        onClick={handleAutoDetect}
        disabled={disabled || detecting}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {detecting ? 'Detecting...' : 'Detect automatically'}
      </button>
    </div>
  );
}
