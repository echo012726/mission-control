/**
 * Advanced Search Query Parser
 * Parses query operators like "due:today", "priority:high", "label:urgent"
 * into structured filter objects for the API
 */

export interface ParsedSearch {
  text: string
  status?: string[]
  priority?: string[]
  labels?: string[]
  tags?: string[]
  hasLabel?: boolean
  hasDueDate?: boolean
  hasAttachment?: boolean
  dueDate?: {
    type: 'today' | 'tomorrow' | 'week' | 'overdue' | 'specific' | 'relative'
    value?: string
    days?: number
  }
  excludeWords: string[]
}

export function parseSearchQuery(query: string): ParsedSearch {
  const result: ParsedSearch = {
    text: '',
    excludeWords: [],
  }

  if (!query || !query.trim()) {
    return result
  }

  // Normalize query
  const normalizedQuery = query.trim()

  // Handle quoted phrases (exact match)
  const quotedMatches = normalizedQuery.match(/"([^"]+)"/g) || []
  let workingQuery = normalizedQuery

  // Extract quoted phrases and add to text search
  if (quotedMatches.length > 0) {
    const phrases = quotedMatches.map(m => m.replace(/"/g, ''))
    result.text = phrases.join(' ')
    // Remove quoted phrases from working query
    quotedMatches.forEach(m => {
      workingQuery = workingQuery.replace(m, '')
    })
  }

  // Handle AND/OR operators
  const andMatch = workingQuery.match(/(\w+)\s+AND\s+(\w+)/gi)
  const orMatch = workingQuery.match(/(\w+)\s+OR\s+(\w+)/gi)

  // Handle exclusion (words starting with -)
  const excludeMatches = workingQuery.match(/-(\w+)/g) || []
  result.excludeWords = excludeMatches.map(m => m.replace('-', '').toLowerCase())
  workingQuery = workingQuery.replace(/-(\w+)/g, '')

  // Split remaining by spaces
  const tokens = workingQuery.split(/\s+/).filter(t => t.length > 0)

  for (const token of tokens) {
    const lowerToken = token.toLowerCase()

    // Status operators
    if (lowerToken.startsWith('status:')) {
      const status = lowerToken.replace('status:', '').replace('inprogress', 'in_progress')
      if (!result.status) result.status = []
      result.status.push(status)
      continue
    }

    // Priority operators
    if (lowerToken.startsWith('priority:') || lowerToken.startsWith('p:')) {
      const priority = lowerToken.replace('priority:', '').replace('p:', '')
      if (!result.priority) result.priority = []
      result.priority.push(priority)
      continue
    }

    // Label operators
    if (lowerToken.startsWith('label:')) {
      const label = token.replace(/^label:/i, '')
      if (!result.labels) result.labels = []
      result.labels.push(label)
      continue
    }

    // Tag operators
    if (lowerToken.startsWith('tag:')) {
      const tag = token.replace(/^tag:/i, '')
      if (!result.tags) result.tags = []
      result.tags.push(tag)
      continue
    }

    // Has operators
    if (lowerToken === 'has:label') {
      result.hasLabel = true
      continue
    }
    if (lowerToken === 'has:due' || lowerToken === 'has:duedate') {
      result.hasDueDate = true
      continue
    }
    if (lowerToken === 'has:attachment' || lowerToken === 'has:file') {
      result.hasAttachment = true
      continue
    }

    // Due date operators
    if (lowerToken.startsWith('due:')) {
      const dueValue = token.replace(/^due:/i, '').toLowerCase()
      result.dueDate = { type: 'specific' }

      switch (dueValue) {
        case 'today':
          result.dueDate.type = 'today'
          break
        case 'tomorrow':
          result.dueDate.type = 'tomorrow'
          break
        case 'week':
        case 'thisweek':
          result.dueDate.type = 'week'
          break
        case 'overdue':
          result.dueDate.type = 'overdue'
          break
        default:
          // Check for relative like "today+3" or "due:3days"
          const plusMatch = dueValue.match(/^(\w+)\+(\d+)$/)
          if (plusMatch) {
            result.dueDate.type = 'relative'
            result.dueDate.days = parseInt(plusMatch[2])
          } else {
            // Specific date
            result.dueDate.type = 'specific'
            result.dueDate.value = dueValue
          }
      }
      continue
    }

    // Add to text search
    if (result.text) {
      result.text += ' ' + token
    } else {
      result.text = token
    }
  }

  return result
}

/**
 * Convert parsed search to API query parameters
 */
export function searchToParams(parsed: ParsedSearch): URLSearchParams {
  const params = new URLSearchParams()

  if (parsed.text) {
    params.set('q', parsed.text)
  }
  if (parsed.status && parsed.status.length > 0) {
    params.set('status', parsed.status.join(','))
  }
  if (parsed.priority && parsed.priority.length > 0) {
    params.set('priority', parsed.priority.join(','))
  }
  if (parsed.labels && parsed.labels.length > 0) {
    params.set('labels', parsed.labels.join(','))
  }
  if (parsed.tags && parsed.tags.length > 0) {
    params.set('tags', parsed.tags.join(','))
  }
  if (parsed.hasLabel) {
    params.set('hasLabel', 'true')
  }
  if (parsed.hasDueDate) {
    params.set('hasDueDate', 'true')
  }
  if (parsed.hasAttachment) {
    params.set('hasAttachment', 'true')
  }
  if (parsed.dueDate) {
    params.set('dueType', parsed.dueDate.type)
    if (parsed.dueDate.value) {
      params.set('dueValue', parsed.dueDate.value)
    }
    if (parsed.dueDate.days !== undefined) {
      params.set('dueDays', parsed.dueDate.days.toString())
    }
  }
  if (parsed.excludeWords.length > 0) {
    params.set('exclude', parsed.excludeWords.join(','))
  }

  return params
}

/**
 * Get suggested searches based on current tasks
 */
export function getSearchSuggestions(tasks: any[]): string[] {
  const suggestions: string[] = []
  const labelSet = new Set<string>()
  const tagSet = new Set<string>()

  for (const task of tasks) {
    if (task.labels) {
      try {
        const labels = typeof task.labels === 'string' 
          ? JSON.parse(task.labels) 
          : task.labels
        labels.forEach((l: string) => labelSet.add(l))
      } catch {}
    }
    if (task.tags) {
      try {
        const tags = typeof task.tags === 'string' 
          ? JSON.parse(task.tags) 
          : task.tags
        tags.forEach((t: string) => tagSet.add(t))
      } catch {}
    }
  }

  // Add common suggestions
  suggestions.push('due:today')
  suggestions.push('due:tomorrow')
  suggestions.push('due:overdue')
  suggestions.push('priority:high')
  suggestions.push('status:inbox')

  // Add labels as suggestions
  labelSet.forEach(l => suggestions.push(`label:${l}`))

  return suggestions.slice(0, 10)
}
