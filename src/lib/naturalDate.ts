// Natural Language Date Parser for Mission Control
// Allows users to type natural language dates like "next friday", "tomorrow", "in 3 days"

export interface ParsedDate {
  date: Date;
  original: string;
  isValid: boolean;
}

// Common relative date patterns
const RELATIVE_PATTERNS: { [key: string]: (ref: Date) => Date } = {
  'today': (d) => new Date(d.setHours(23, 59, 59, 999)),
  'tonight': (d) => new Date(d.setHours(20, 0, 0, 0)),
  'tomorrow': (d) => {
    const tomorrow = new Date(d);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow;
  },
  'tomorrow morning': (d) => {
    const tomorrow = new Date(d);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  },
  'tomorrow afternoon': (d) => {
    const tomorrow = new Date(d);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow;
  },
  'next week': (d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 7);
    return next;
  },
  'next month': (d) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return next;
  },
  'next year': (d) => {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  },
  'monday': getNextDayOfWeek,
  'tuesday': getNextDayOfWeek,
  'wednesday': getNextDayOfWeek,
  'thursday': getNextDayOfWeek,
  'friday': getNextDayOfWeek,
  'saturday': getNextDayOfWeek,
  'sunday': getNextDayOfWeek,
};

const DAY_MAP: { [key: string]: number } = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

function getNextDayOfWeek(d: Date): Date {
  // This will be called with the day name, need to handle separately
  return d;
}

function getNextDay(dayName: string, ref: Date = new Date()): Date {
  const result = new Date(ref);
  const dayIndex = DAY_MAP[dayName.toLowerCase()];
  
  if (dayIndex === undefined) return result;
  
  const currentDay = result.getDay();
  let daysUntil = dayIndex - currentDay;
  
  // If today is the day or we've passed it, get next week's occurrence
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  
  result.setDate(result.getDate() + daysUntil);
  return result;
}

// Number patterns like "in 3 days", "in 2 weeks"
const IN_NUM_PATTERN = /^in\s+(\d+)\s+(days?|weeks?|months?|hours?|minutes?)$/i;
const NUM_DAY_PATTERN = /^(\d+)\s+(days?|weeks?|months?|hours?|minutes?)$/i;
const SPECIFIC_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})$/;

export function parseNaturalDate(input: string): ParsedDate {
  if (!input || typeof input !== 'string') {
    return { date: new Date(), original: input || '', isValid: false };
  }

  const trimmed = input.trim().toLowerCase();
  const refDate = new Date();

  // Handle day names specially (includes sunday=0)
  if (Object.prototype.hasOwnProperty.call(DAY_MAP, trimmed)) {
    const date = getNextDay(trimmed, refDate);
    return { date, original: input, isValid: true };
  }

  // Try exact matches first
  if (RELATIVE_PATTERNS[trimmed]) {
    const date = RELATIVE_PATTERNS[trimmed](new Date(refDate));
    return { date, original: input, isValid: true };
  }

  // Try "next [day]" pattern
  const nextDayMatch = trimmed.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
  if (nextDayMatch) {
    const date = getNextDay(nextDayMatch[1], refDate);
    return { date, original: input, isValid: true };
  }

  // Try "in X days/weeks/months" pattern
  const inMatch = trimmed.match(IN_NUM_PATTERN);
  if (inMatch) {
    const num = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    const date = addTimeUnit(new Date(refDate), num, unit);
    return { date, original: input, isValid: true };
  }

  // Try "X days/weeks/months" pattern (relative from now)
  const numMatch = trimmed.match(NUM_DAY_PATTERN);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const unit = numMatch[2].toLowerCase();
    // Only valid if not a plain number
    if (unit) {
      const date = addTimeUnit(new Date(refDate), num, unit);
      return { date, original: input, isValid: true };
    }
  }

  // Try specific date formats
  if (SPECIFIC_DATE_PATTERN.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return { date, original: input, isValid: true };
    }
  }

  // Try ISO date
  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) {
    return { date: isoDate, original: input, isValid: true };
  }

  // Parse time expressions like "morning", "afternoon", "evening"
  const timeMatch = trimmed.match(/(today|tomorrow)?\s*(morning|afternoon|evening|night)/i);
  if (timeMatch) {
    const [, prefix, timeOfDay] = timeMatch;
    const date = new Date(refDate);
    
    if (prefix === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    
    switch (timeOfDay.toLowerCase()) {
      case 'morning':
        date.setHours(9, 0, 0, 0);
        break;
      case 'afternoon':
        date.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        date.setHours(18, 0, 0, 0);
        break;
      case 'night':
        date.setHours(20, 0, 0, 0);
        break;
    }
    
    return { date, original: input, isValid: true };
  }

  // Default: return invalid
  return { date: new Date(), original: input, isValid: false };
}

function addTimeUnit(date: Date, num: number, unit: string): Date {
  const result = new Date(date);
  
  switch (unit.replace(/s$/, '')) { // Remove plural 's'
    case 'minute':
    case 'min':
      result.setMinutes(result.getMinutes() + num);
      break;
    case 'hour':
    case 'hr':
      result.setHours(result.getHours() + num);
      break;
    case 'day':
    case 'd':
      result.setDate(result.getDate() + num);
      break;
    case 'week':
    case 'wk':
      result.setDate(result.getDate() + (num * 7));
      break;
    case 'month':
    case 'mo':
      result.setMonth(result.getMonth() + num);
      break;
  }
  
  return result;
}

// Format date for display in input
export function formatNaturalDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0 && days <= 7) return `In ${days} days`;
  if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Get quick suggestions
export function getDateSuggestions(): { label: string; value: string }[] {
  return [
    { label: 'Today', value: 'today' },
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'Tomorrow Morning', value: 'tomorrow morning' },
    { label: 'This Friday', value: 'friday' },
    { label: 'Next Monday', value: 'monday' },
    { label: 'Next Week', value: 'next week' },
    { label: 'In 3 Days', value: 'in 3 days' },
    { label: 'In 1 Week', value: 'in 1 week' },
    { label: 'In 1 Month', value: 'in 1 month' },
  ];
}
