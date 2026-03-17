import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to map Trello list names to status
function mapListNameToStatus(listName: string): string {
  const name = listName.toLowerCase()
  if (name.includes('done') || name.includes('complete') || name.includes('archive')) {
    return 'done'
  }
  if (name.includes('progress') || name.includes('working')) {
    return 'inProgress'
  }
  if (name.includes('block')) {
    return 'blocked'
  }
  if (name.includes('backlog') || name.includes('later') || name.includes('someday')) {
    return 'planned'
  }
  if (name.includes('inbox') || name.includes('new') || name.includes('todo')) {
    return 'inbox'
  }
  return 'planned'
}

// POST /api/import/trello - Import tasks from Trello JSON export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options = {} } = body
    
    // Support both full Trello export and cards array
    let cards: any[] = []
    
    if (Array.isArray(data)) {
      // Direct array of cards
      cards = data
    } else if (data && data.lists && Array.isArray(data.lists)) {
      // Full Trello board export
      const listIdToName: Record<string, string> = {}
      data.lists.forEach((list: any) => {
        listIdToName[list.id] = list.name
      })
      
      // Collect all cards from all lists
      if (data.cards && Array.isArray(data.cards)) {
        cards = data.cards.map((card: any) => ({
          ...card,
          _listName: listIdToName[card.idList]
        }))
      }
    } else if (data && data.cards && Array.isArray(data.cards)) {
      // Cards array with lists info
      cards = data.cards
    } else {
      return NextResponse.json(
        { error: 'Invalid Trello export format. Expected array of cards or full board export.' },
        { status: 400 }
      )
    }

    const {
      skipArchived = true,
      defaultLane = 'planned'
    } = options

    let imported = 0
    let skipped = 0
    let duplicates = 0
    const errors: string[] = []

    for (const card of cards) {
      try {
        // Skip if no name/title
        if (!card.name) {
          errors.push(`Skipped card without name: ${card.id}`)
          skipped++
          continue
        }

        // Skip archived cards if option set
        if (skipArchived && card.closed) {
          skipped++
          continue
        }

        // Check for duplicate by trelloId
        const existing = await prisma.task.findUnique({
          where: { trelloId: String(card.id) }
        })

        if (existing) {
          duplicates++
          continue
        }

        // Determine status from list name or idList
        let status = defaultLane
        if (card._listName) {
          status = mapListNameToStatus(card._listName)
        } else if (card.idList) {
          // If we have list ID but not name, use default
          status = defaultLane
        }

        // Extract labels as tags
        const tags: string[] = []
        if (card.labels && Array.isArray(card.labels)) {
          card.labels.forEach((label: any) => {
            if (label.name) tags.push(label.name)
            else if (typeof label === 'string') tags.push(label)
          })
        }

        // Parse due date
        let dueDate = null
        if (card.due) {
          try {
            dueDate = new Date(card.due)
          } catch {
            // Invalid date, skip
          }
        }

        await prisma.task.create({
          data: {
            title: card.name,
            description: card.desc || '',
            status: card.closed ? 'done' : status,
            priority: 'medium',
            tags: JSON.stringify(tags),
            dueDate,
            trelloId: String(card.id),
            trelloBoardId: card.idBoard ? String(card.idBoard) : null,
            trelloListId: card.idList ? String(card.idList) : null,
          }
        })

        imported++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Error importing card ${card.id}: ${errorMsg}`)
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'import',
        payload: JSON.stringify({ source: 'trello', imported, skipped, duplicates }),
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        imported,
        skipped,
        duplicates,
        errors: errors.length > 0 ? errors : undefined,
      }
    })
  } catch (error) {
    console.error('Trello import error:', error)
    return NextResponse.json(
      { error: 'Failed to import Trello cards' },
      { status: 500 }
    )
  }
}

// GET /api/import/trello - Get import instructions
export async function GET() {
  return NextResponse.json({
    instructions: 'POST JSON with { data: [...cards], options?: { skipArchived, defaultLane } }',
    expectedFormat: {
      data: 'Array of Trello card objects OR full Trello board export with lists and cards',
      options: {
        skipArchived: 'Boolean - skip archived cards (default: true)',
        defaultLane: 'Default lane for cards without list mapping (default: planned)'
      }
    },
    fieldMapping: {
      name: 'title',
      desc: 'description',
      due: 'dueDate',
      closed: 'status (done if true)',
      idList: 'status mapping based on list name',
      labels: 'tags array'
    }
  })
}
