/**
 * AI-Powered Task Suggestions Engine
 * Analyzes tasks and provides intelligent recommendations
 */

export interface TaskSuggestion {
  taskId: string;
  title: string;
  reason: string;
  priority: number;
  score: number;
  suggestedAction: 'work_on' | 'schedule' | 'delegate' | 'break' | 'complete';
  estimatedMinutes?: number;
}

export interface SuggestionContext {
  currentHour: number;
  dayOfWeek: number;
  completedToday: number;
  totalTasks: number;
  focusScore: number;
}

/**
 * Calculate suggestion score for a task
 */
function calculateTaskScore(
  task: any,
  context: SuggestionContext
): number {
  let score = 0;
  
  // Priority weight (0-30 points)
  const priorityMap: Record<string, number> = {
    urgent: 30,
    high: 24,
    medium: 18,
    low: 12,
    none: 6
  };
  score += priorityMap[task.priority] || 0;
  
  // Due date urgency (0-25 points)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) score += 25; // Overdue
    else if (hoursUntilDue < 24) score += 20;
    else if (hoursUntilDue < 48) score += 15;
    else if (hoursUntilDue < 168) score += 10; // This week
  }
  
  // Karma points weight (0-15 points)
  score += Math.min((task.karma || 0) / 10, 15);
  
  // Recency (0-10 points) - older tasks get slight bump
  const createdDays = task.createdAt 
    ? (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  if (createdDays > 3) score += Math.min(createdDays / 5, 10);
  
  // Blocked tasks get priority (0-10 points)
  if (task.dependsOn && task.dependsOn.length > 0) score += 10;
  
  // Time-based suggestions (0-10 points)
  // Morning: focus on high-priority tasks
  if (context.currentHour >= 6 && context.currentHour < 12) {
    if (task.priority === 'urgent' || task.priority === 'high') score += 10;
  }
  // Afternoon: good for complex tasks
  else if (context.currentHour >= 12 && context.currentHour < 17) {
    if (task.status === 'inProgress') score += 8;
  }
  // Evening: wrap-up tasks
  else if (context.currentHour >= 17 || context.currentHour < 22) {
    if (task.status === 'inProgress') score += 10;
  }
  
  return Math.round(score);
}

/**
 * Generate suggestions based on tasks and context
 */
export function generateSuggestions(
  tasks: any[],
  context: SuggestionContext
): TaskSuggestion[] {
  const suggestions: TaskSuggestion[] = [];
  
  // Filter out completed tasks
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'completed');
  
  for (const task of activeTasks) {
    const score = calculateTaskScore(task, context);
    
    let suggestedAction: TaskSuggestion['suggestedAction'] = 'work_on';
    let reason = '';
    
    // Determine suggested action based on context and task
    if (task.status === 'blocked') {
      suggestedAction = 'delegate';
      reason = 'Task is blocked - consider unblocking or reassigning';
    } else if (task.priority === 'low' && score < 20) {
      suggestedAction = 'schedule';
      reason = 'Low priority - schedule for later';
    } else if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDue < 0) {
        reason = `Overdue by ${Math.abs(hoursUntilDue).toFixed(1)} hours`;
      } else if (hoursUntilDue < 2) {
        reason = `Due in ${hoursUntilDue.toFixed(0)} minutes`;
      } else {
        reason = `Due in ${hoursUntilDue.toFixed(0)} hours`;
      }
    } else if (task.karma && task.karma > 50) {
      reason = `High-value task (${task.karma} karma)`;
    } else {
      reason = 'Best next task based on priority and timing';
    }
    
    // Estimate time based on karma (rough heuristic)
    const estimatedMinutes = Math.max(15, Math.min(180, (task.karma || 25) * 3));
    
    suggestions.push({
      taskId: task.id,
      title: task.title,
      reason,
      priority: task.priority === 'urgent' ? 4 : task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1,
      score,
      suggestedAction,
      estimatedMinutes
    });
  }
  
  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);
  
  // Add special suggestions based on context
  if (context.completedToday === 0 && context.totalTasks > 0) {
    // First task of the day - motivational
    suggestions.unshift({
      taskId: 'start-day',
      title: 'Start your day!',
      reason: `You have ${context.totalTasks} tasks waiting. Let's get moving! 🚀`,
      priority: 3,
      score: 100,
      suggestedAction: 'work_on',
      estimatedMinutes: 0
    });
  }
  
  if (context.completedToday >= 5 && context.focusScore < 50) {
    // Suggest a break after productive session
    suggestions.push({
      taskId: 'take-break',
      title: 'Take a break',
      reason: `You've completed ${context.completedToday} tasks! Time to recharge. ☕`,
      priority: 1,
      score: 75,
      suggestedAction: 'break',
      estimatedMinutes: 15
    });
  }
  
  return suggestions.slice(0, 10); // Top 10 suggestions
}

/**
 * Get AI insight about productivity patterns
 */
export function getAIInsight(tasks: any[], context: SuggestionContext): string {
  const insights: string[] = [];
  
  // Overdue tasks insight
  const overdue = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < new Date();
  });
  
  if (overdue.length > 0) {
    insights.push(`You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}.`);
  }
  
  // High karma tasks insight
  const highKarma = tasks.filter(t => (t.karma || 0) > 50);
  if (highKarma.length > 0) {
    insights.push(`${highKarma.length} high-value task${highKarma.length > 1 ? 's' : ''} waiting.`);
  }
  
  // Productivity time insight
  if (context.currentHour >= 9 && context.currentHour <= 11) {
    insights.push('Morning focus time - tackle your hardest task now.');
  } else if (context.currentHour >= 14 && context.currentHour <= 16) {
    insights.push('Afternoon energy - good for collaborative tasks.');
  }
  
  // Completion rate insight
  if (context.completedToday > 0) {
    const completionRate = (context.completedToday / (context.completedToday + context.totalTasks)) * 100;
    if (completionRate > 60) {
      insights.push(`Great pace! ${completionRate.toFixed(0)}% completion rate today.`);
    }
  }
  
  return insights.length > 0 ? insights.join(' ') : 'Stay focused and keep crushing it! 💪';
}
