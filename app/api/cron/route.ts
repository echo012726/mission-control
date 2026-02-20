import { NextResponse } from 'next/server'
import { getCronJobs } from '@/lib/backend/data'

export async function GET() {
  try {
    return NextResponse.json(await getCronJobs())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load cron jobs' }, { status: 500 })
  }
}
