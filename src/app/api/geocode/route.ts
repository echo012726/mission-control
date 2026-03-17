import { NextRequest, NextResponse } from 'next/server'

// Nominatim API (OpenStreetMap) - free geocoding
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'MissionControl/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    const results = data.map((item: any) => ({
      name: item.name,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}

// Reverse geocoding - get address from coordinates
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { lat, lon } = body

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Coordinates required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'MissionControl/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()

    return NextResponse.json({
      name: data.name,
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      type: data.type,
    })
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 })
  }
}
