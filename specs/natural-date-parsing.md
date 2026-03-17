# Natural Language Date Parsing - Quick Add Enhancement

## Overview
Enhance Quick Add to parse natural language dates and times from task input.

## Input Examples
- "Buy milk tomorrow"
- "Meeting Friday at 2pm"
- "Submit report next Monday 9am"
- "Call mom in 3 days"
- "Review code in 2 hours"
- "Pay bills this Friday"
- "Lunch with John tomorrow noon"

## Parsing Rules

### Relative Days
| Input | Output |
|-------|--------|
| today | Current date |
| tomorrow | Current date + 1 day |
| next week | Current date + 7 days |
| monday/tuesday/etc. | Next occurrence of that day |
| next monday/etc. | First occurrence after this week |

### Time Patterns
| Input | Output |
|-------|--------|
| 5pm, 5:00pm, 17:00 | 17:00 |
| noon, 12pm | 12:00 |
| midnight, 12am | 00:00 |
| morning 9am | 09:00 |
| at 3:30 | 15:30 |

### Duration Patterns
| Input | Output |
|-------|--------|
| in 2 hours | now + 2 hours |
| in 3 days | now + 3 days |
| in 2 weeks | now + 14 days |

## Implementation

### File: src/lib/dateParser.ts
- `parseNaturalDate(input: string): { date: Date | null, time: string | null, remaining: string }`
- Handles relative days, weekdays, times, durations
- Returns parsed date/time + remaining text (task title)

### File: src/components/QuickAdd.tsx
- Add real-time preview of parsed date/time
- Visual indicator when date is detected
- Show parsed date in human-readable format

### File: src/app/api/tasks/route.ts (or new endpoint)
- Accept raw input and parse server-side if needed

## Acceptance Criteria
- [ ] Parses "tomorrow" as next day
- [ ] Parses weekday names (Monday, Friday, etc.)
- [ ] Parses time (5pm, 2:30pm, noon, midnight)
- [ ] Parses duration (in 2 hours, in 3 days)
- [ ] Shows preview in Quick Add UI
- [ ] Falls back gracefully if no date detected
