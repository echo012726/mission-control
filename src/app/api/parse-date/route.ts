import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalDate, formatParsedDate } from '@/lib/dateParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 }
      );
    }
    
    const result = parseNaturalDate(input);
    
    return NextResponse.json({
      original: input,
      hasDate: result.hasDate,
      date: result.date?.toISOString() || null,
      time: result.time,
      remaining: result.remaining,
      formatted: result.date ? formatParsedDate(result.date) : null
    });
  } catch (error) {
    console.error('Date parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse date' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      POST: {
        description: 'Parse natural language date from input',
        body: { input: 'string' },
        example: {
          input: 'Buy milk tomorrow at 5pm'
        }
      }
    },
    supportedFormats: [
      'today, tomorrow, next week',
      'monday, tuesday, friday, etc.',
      'next monday, this friday',
      '5pm, 5:30pm, 17:00',
      'noon, midnight',
      'in 3 days, in 2 hours, in 1 week'
    ]
  });
}
