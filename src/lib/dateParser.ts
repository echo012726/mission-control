/**
 * Natural Language Date Parser for Quick Add
 * Parses dates from strings like "tomorrow at 5pm", "next Friday 2pm", "in 3 days"
 */

interface ParseResult {
  date: Date | null;
  time: string | null;
  hasDate: boolean;
  remaining: string;
  original: string;
}

interface TimeResult {
  hour: number;
  minute: number;
  raw: string;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_ABBREVS: Record<string, number> = {
  'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
};

/**
 * Parse time from various formats
 */
function parseTime(input: string): TimeResult | null {
  const lower = input.toLowerCase().trim();
  
  // noon, 12pm, 12am, midnight
  if (lower === 'noon' || lower === '12pm') {
    return { hour: 12, minute: 0, raw: 'noon' };
  }
  if (lower === 'midnight' || lower === '12am') {
    return { hour: 0, minute: 0, raw: 'midnight' };
  }
  
  // 5pm, 5:30pm, 17:00, 9am, 9:00am
  const timeMatch = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3];
    
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    
    return { hour, minute, raw: timeMatch[0] };
  }
  
  // 5:30 pm (with space)
  const spacedMatch = lower.match(/^(\d{1,2}):(\d{2})\s+(am|pm)$/);
  if (spacedMatch) {
    let hour = parseInt(spacedMatch[1], 10);
    const minute = parseInt(spacedMatch[2], 10);
    const meridiem = spacedMatch[3];
    
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    
    return { hour, minute, raw: spacedMatch[0] };
  }
  
  return null;
}

/**
 * Get the next occurrence of a weekday
 */
function getNextWeekday(weekday: number): Date {
  const today = new Date();
  const todayWeekday = today.getDay();
  let daysUntil = weekday - todayWeekday;
  
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * Parse relative day expressions
 */
function parseRelativeDay(input: string): Date | null {
  const lower = input.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (lower) {
    case 'today':
      return today;
    case 'tomorrow':
    case 'tmr':
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    case 'next week':
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
  }
  
  // Check for weekday names
  const weekdayIndex = DAY_NAMES.indexOf(lower);
  if (weekdayIndex !== -1) {
    return getNextWeekday(weekdayIndex);
  }
  
  // Check abbreviations (mon, tue, etc.)
  if (DAY_ABBREVS[lower]) {
    return getNextWeekday(DAY_ABBREVS[lower]);
  }
  
  // "next monday" style
  const nextMatch = lower.match(/^next\s+(.+)$/);
  if (nextMatch) {
    const nextWeekdayIndex = DAY_NAMES.indexOf(nextMatch[1].toLowerCase());
    if (nextWeekdayIndex !== -1) {
      return getNextWeekday(nextWeekdayIndex);
    }
  }
  
  // "this friday" style
  const thisMatch = lower.match(/^this\s+(.+)$/);
  if (thisMatch) {
    const thisWeekdayIndex = DAY_NAMES.indexOf(thisMatch[1].toLowerCase());
    if (thisWeekdayIndex !== -1) {
      const result = getNextWeekday(thisWeekdayIndex);
      // If it's today, don't advance to next week
      const todayIdx = today.getDay();
      if (thisWeekdayIndex === todayIdx) {
        return today;
      }
      return result;
    }
  }
  
  return null;
}

/**
 * Parse duration expressions like "in 3 days", "in 2 hours"
 */
function parseDuration(input: string): Date | null {
  const lower = input.toLowerCase().trim();
  const now = new Date();
  
  const durationMatch = lower.match(/^in\s+(\d+)\s+(hour|hours|day|days|week|weeks|minute|minutes)$/);
  if (durationMatch) {
    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    
    switch (unit) {
      case 'hour':
      case 'hours':
        now.setHours(now.getHours() + amount);
        break;
      case 'minute':
      case 'minutes':
        now.setMinutes(now.getMinutes() + amount);
        break;
      case 'day':
      case 'days':
        now.setDate(now.getDate() + amount);
        break;
      case 'week':
      case 'weeks':
        now.setDate(now.getDate() + amount * 7);
        break;
    }
    
    now.setSeconds(0, 0);
    return now;
  }
  
  return null;
}

/**
 * Main parsing function
 */
export function parseNaturalDate(input: string): ParseResult {
  let remaining = input;
  let parsedDate: Date | null = null;
  let parsedTime: TimeResult | null = null;
  
  // Try to find and remove time patterns first
  const timePatterns = [
    /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
    /\bat\s+(noon|midnight)\b/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)(?:\s|$|:))/i,
    /\b(noon|midnight)\b/i
  ];
  
  for (const pattern of timePatterns) {
    const match = remaining.match(pattern);
    if (match) {
      const timeStr = match[1] || match[2];
      const timeResult = parseTime(timeStr);
      if (timeResult) {
        parsedTime = timeResult;
        remaining = remaining.replace(match[0], ' ').trim();
        break;
      }
    }
  }
  
  // Try to find date patterns - "in 3 days", "in 2 hours"
  const durationPatterns = [
    /\bin\s+\d+\s+(hour|hours|day|days|week|weeks|minute|minutes)\b/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      const durationResult = parseDuration(match[0]);
      if (durationResult) {
        parsedDate = durationResult;
        if (match[1] === 'hour' || match[1] === 'hours' || match[1] === 'minute' || match[1] === 'minutes') {
          parsedTime = {
            hour: durationResult.getHours(),
            minute: durationResult.getMinutes(),
            raw: match[0]
          };
        }
        remaining = remaining.replace(match[0], ' ').trim();
        break;
      }
    }
  }
  
  // If no duration found, try relative days
  if (!parsedDate) {
    const dateWords = ['today', 'tomorrow', 'next week', 'this ', 'next '];
    for (const word of dateWords) {
      if (remaining.toLowerCase().includes(word)) {
        const idx = remaining.toLowerCase().indexOf(word);
        const before = remaining.substring(0, idx).trim();
        const after = remaining.substring(idx + word.length).trim();
        
        const dateResult = parseRelativeDay(remaining.substring(idx, idx + word.length + 20));
        if (dateResult) {
          parsedDate = dateResult;
          remaining = (before + ' ' + after).trim();
          break;
        }
      }
    }
    
    if (!parsedDate) {
      const dateResult = parseRelativeDay(remaining);
      if (dateResult) {
        parsedDate = dateResult;
        remaining = '';
      }
    }
  }
  
  // Combine date and time
  if (parsedDate && parsedTime) {
    parsedDate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
  } else if (parsedTime && parsedDate === null) {
    parsedDate = new Date();
    parsedDate.setHours(parsedTime.hour, parsedTime.minute, 0, 0);
  }
  
  // Clean up remaining string
  remaining = remaining
    .replace(/\s+/g, ' ')
    .replace(/^(and|then|at|on)\s+/i, '')
    .trim();
  
  return {
    date: parsedDate,
    time: parsedTime ? `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}` : null,
    hasDate: parsedDate !== null,
    remaining: remaining || input,
    original: input
  };
}

/**
 * Format date for display
 */
export function formatParsedDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  const dateStr = date.toDateString();
  
  if (dateStr === todayStr) {
    return `Today at ${formatTime(date)}`;
  } else if (dateStr === tomorrowStr) {
    return `Tomorrow at ${formatTime(date)}`;
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ` at ${formatTime(date)}`;
  }
}

function formatTime(date: Date): string {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  const displayMinute = String(minute).padStart(2, '0');
  
  if (minute === 0) {
    return `${displayHour}${ampm}`;
  }
  return `${displayHour}:${displayMinute}${ampm}`;
}

/**
 * Check if input likely contains a date/time
 */
export function mightHaveDate(input: string): boolean {
  const lower = input.toLowerCase();
  const dateIndicators = [
    'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'next week', 'this ', 'in ', 'at ', 'am', 'pm', 'noon', 'midnight'
  ];
  
  return dateIndicators.some(indicator => lower.includes(indicator));
}
