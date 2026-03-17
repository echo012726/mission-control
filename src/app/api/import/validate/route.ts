import { NextRequest, NextResponse } from 'next/server'

// POST /api/import/validate - Validate import file format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, source } = body
    
    if (!data) {
      return NextResponse.json(
        { valid: false, error: 'No data provided' },
        { status: 400 }
      )
    }

    if (!source || !['asana', 'trello'].includes(source)) {
      return NextResponse.json(
        { valid: false, error: 'Source must be "asana" or "trello"' },
        { status: 400 }
      )
    }

    let itemCount = 0
    let sampleItems: any[] = []
    let isValid = false
    let details: string = ''

    if (source === 'asana') {
      // Validate Asana format
      if (Array.isArray(data)) {
        itemCount = data.length
        sampleItems = data.slice(0, 3).map((t: any) => ({
          name: t.name || 'unnamed',
          gid: t.gid,
          completed: t.completed || false,
          due_on: t.due_on || null
        }))
        isValid = itemCount > 0
        details = `Found ${itemCount} Asana tasks`
      } else if (data.data && Array.isArray(data.data)) {
        itemCount = data.data.length
        sampleItems = data.data.slice(0, 3).map((t: any) => ({
          name: t.name || 'unnamed',
          gid: t.gid,
          completed: t.completed || false,
          due_on: t.due_on || null
        }))
        isValid = itemCount > 0
        details = `Found ${itemCount} Asana tasks in "data" field`
      } else {
        details = 'Expected array of tasks or object with "data" array'
      }
    } else if (source === 'trello') {
      // Validate Trello format
      if (Array.isArray(data)) {
        // Direct cards array
        itemCount = data.length
        sampleItems = data.slice(0, 3).map((c: any) => ({
          name: c.name || 'unnamed',
          id: c.id,
          closed: c.closed || false,
          due: c.due || null
        }))
        isValid = itemCount > 0
        details = `Found ${itemCount} Trello cards`
      } else if (data.cards && Array.isArray(data.cards)) {
        // Full board export
        itemCount = data.cards.length
        sampleItems = data.cards.slice(0, 3).map((c: any) => ({
          name: c.name || 'unnamed',
          id: c.id,
          closed: c.closed || false,
          due: c.due || null
        }))
        isValid = itemCount > 0
        const listCount = data.lists?.length || 0
        details = `Found ${itemCount} Trello cards in ${listCount} lists`
      } else {
        details = 'Expected array of cards or object with "cards" array'
      }
    }

    return NextResponse.json({
      valid: isValid,
      source,
      itemCount,
      sampleItems,
      details
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate data' },
      { status: 500 }
    )
  }
}
