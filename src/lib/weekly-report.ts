type StatusBreakdown = {
  inbox: number;
  planned: number;
  in_progress: number;
  blocked: number;
  done: number;
};

type PriorityBreakdown = {
  high: number;
  medium: number;
  low: number;
};

export type WeeklyReportTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function parseTags(rawTags: string | null | undefined): string[] {
  if (!rawTags) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawTags);
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    }
  } catch {
    // Fallback for malformed legacy values; treat as comma-separated plain text.
    return rawTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export function getWeekRange(offset: number, referenceDate = new Date()): { monday: Date; sunday: Date } {
  const now = new Date(referenceDate);
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday - (offset * 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export function calculateStreak(tasks: WeeklyReportTask[], referenceDate = new Date()): number {
  const completedDates = new Set(
    tasks
      .filter(task => task.status === 'done' && task.updatedAt)
      .map(task => toIsoDate(task.updatedAt))
  );

  let streak = 0;
  const today = new Date(referenceDate);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = toIsoDate(checkDate);

    if (completedDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function buildWeeklyReport(tasks: WeeklyReportTask[], offset: number, referenceDate = new Date()) {
  const { monday, sunday } = getWeekRange(offset, referenceDate);

  const tasksCreatedThisWeek = tasks.filter(task => isWithinRange(task.createdAt, monday, sunday));
  const tasksCompletedThisWeek = tasks.filter(
    task => task.status === 'done' && isWithinRange(task.updatedAt, monday, sunday)
  );

  const completionRate = tasksCreatedThisWeek.length > 0
    ? Math.round((tasksCompletedThisWeek.length / tasksCreatedThisWeek.length) * 100)
    : 0;

  const statusBreakdown: StatusBreakdown = {
    inbox: 0,
    planned: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  };

  const priorityBreakdown: PriorityBreakdown = {
    high: 0,
    medium: 0,
    low: 0,
  };

  tasks.forEach(task => {
    if (task.status in statusBreakdown) {
      const key = task.status as keyof StatusBreakdown;
      statusBreakdown[key] += 1;
    }

    if (task.priority in priorityBreakdown) {
      const key = task.priority as keyof PriorityBreakdown;
      priorityBreakdown[key] += 1;
    }
  });

  const weeklyTaskIds = new Set([
    ...tasksCreatedThisWeek.map(task => task.id),
    ...tasksCompletedThisWeek.map(task => task.id),
  ]);

  const tagCounts: Record<string, number> = {};
  tasks
    .filter(task => weeklyTaskIds.has(task.id))
    .forEach(task => {
      parseTags(task.tags).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const dailyBreakdown: Array<{ date: string; label: string; created: number; completed: number }> = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dateStr = toIsoDate(day);

    const created = tasksCreatedThisWeek.filter(task => toIsoDate(task.createdAt) === dateStr).length;
    const completed = tasksCompletedThisWeek.filter(task => toIsoDate(task.updatedAt) === dateStr).length;

    dailyBreakdown.push({
      date: dateStr,
      label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      created,
      completed,
    });
  }

  const weekLabel = offset === 0
    ? 'This Week'
    : `${Math.abs(offset)} week${Math.abs(offset) > 1 ? 's' : ''} ago`;

  const currentStreak = calculateStreak(tasks, referenceDate);
  const totalActive = Object.entries(statusBreakdown)
    .filter(([status]) => status !== 'done')
    .reduce((sum, [, count]) => sum + count, 0);

  const tasksCompleted = [...tasksCompletedThisWeek]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map(task => ({ id: task.id, title: task.title, completedAt: task.updatedAt.toISOString() }));

  const tasksCreated = [...tasksCreatedThisWeek]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(task => ({ id: task.id, title: task.title, createdAt: task.createdAt.toISOString() }));

  return {
    weekRange: {
      start: monday.toISOString(),
      end: sunday.toISOString(),
    },
    tasksCompleted: {
      count: tasksCompleted.length,
      tasks: tasksCompleted,
    },
    tasksCreated: {
      count: tasksCreated.length,
      tasks: tasksCreated,
    },
    completionRate,
    statusBreakdown,
    priorityBreakdown,
    topTags,
    dailyBreakdown,
    activitySummary: {
      total: 0,
      taskCreated: 0,
      taskCompleted: 0,
      taskMoved: 0,
      agentHeartbeat: 0,
    },
    currentStreak,

    // Backward compatibility for the older dashboard API contract.
    weekStart: monday.toISOString(),
    weekEnd: sunday.toISOString(),
    weekLabel,
    summary: {
      completedCount: tasksCompleted.length,
      createdCount: tasksCreated.length,
      completionRate,
      totalActive,
      currentStreak,
    },
    tasksByStatus: statusBreakdown,
    tasksByPriority: priorityBreakdown,
  };
}
