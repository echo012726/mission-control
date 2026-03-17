import { NextRequest, NextResponse } from 'next/server';
import { generateSuggestions, getAIInsight } from '@/lib/suggestions';

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build full context
    const currentHour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // For now, we'll fetch tasks from the database
    // In a real implementation, this would query the database
    // Using mock data structure that matches the frontend
    
    // This would typically come from a database query
    // For now, return a placeholder that the frontend will populate
    const mockContext = {
      currentHour,
      dayOfWeek,
      completedToday: 0,
      totalTasks: 0,
      focusScore: 50
    };
    
    // Return the API structure - frontend will fetch tasks and call generateSuggestions
    return NextResponse.json({
      success: true,
      message: 'Use POST to get personalized suggestions with your tasks',
      context: mockContext
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, context, limit } = body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { success: false, error: 'Tasks array required' },
        { status: 400 }
      );
    }
    
    // Build full context
    const fullContext = {
      currentHour: context?.currentHour ?? new Date().getHours(),
      dayOfWeek: context?.dayOfWeek ?? new Date().getDay(),
      completedToday: context?.completedToday ?? 0,
      totalTasks: context?.totalTasks ?? tasks.length,
      focusScore: context?.focusScore ?? 50
    };
    
    // Generate suggestions
    const suggestions = generateSuggestions(tasks, fullContext);
    const insight = getAIInsight(tasks, fullContext);
    
    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, limit || 10),
      insight,
      context: fullContext
    });
  } catch (error) {
    console.error('Suggestions POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
