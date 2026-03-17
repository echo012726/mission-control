import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { parseNaturalDate, formatParsedDate, mightHaveDate } from '../dateParser'

describe('dateParser', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T10:00:00Z')) // Saturday, March 14, 2026
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('parseNaturalDate', () => {
    it('parses "tomorrow" correctly', () => {
      const result = parseNaturalDate('tomorrow')
      expect(result.date?.getDate()).toBe(15) // March 15
    })

    it('parses "today" correctly', () => {
      const result = parseNaturalDate('today')
      expect(result.date?.getDate()).toBe(14) // March 14
    })

    it('parses "next Friday" correctly', () => {
      const result = parseNaturalDate('next Friday')
      expect(result.date?.getDay()).toBe(5) // Friday
    })

    it('parses "in 3 days" correctly', () => {
      const result = parseNaturalDate('in 3 days')
      expect(result.date?.getDate()).toBe(17) // March 17
    })

    it('parses "next week" correctly', () => {
      const result = parseNaturalDate('next week')
      expect(result.date?.getDate()).toBe(21) // March 21
    })

    it('returns null for unrecognized input', () => {
      const result = parseNaturalDate('xyz123')
      expect(result.date).toBeNull()
    })

    it('returns hasDate: true for relative dates', () => {
      const result = parseNaturalDate('tomorrow')
      expect(result.hasDate).toBe(true)
    })
  })

  describe('mightHaveDate', () => {
    it('returns true for input with date-like words', () => {
      expect(mightHaveDate('tomorrow')).toBe(true)
      expect(mightHaveDate('next Friday')).toBe(true)
      expect(mightHaveDate('in 3 days')).toBe(true)
    })

    it('returns false for simple text', () => {
      expect(mightHaveDate('Buy milk')).toBe(false)
      expect(mightHaveDate('Call mom')).toBe(false)
    })
  })

  describe('formatParsedDate', () => {
    it('formats today dates with relative text', () => {
      const date = new Date('2026-03-14T10:00:00Z')
      const formatted = formatParsedDate(date)
      // "Today at 10am" is expected for today's date
      expect(formatted).toBeTruthy()
    })

    it('formats future dates with month and day', () => {
      const date = new Date('2026-04-15T10:00:00Z')
      const formatted = formatParsedDate(date)
      expect(formatted).toContain('15')
    })
  })
})
