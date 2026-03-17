'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, Target, Calendar, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface WeeklyReportData {
  weekRange: { start: string; end: string };
  tasksCompleted: { count: number; tasks: Array<{ id: string; title: string; completedAt: string }> };
  tasksCreated: { count: number; tasks: Array<{ id: string; title: string; createdAt: string }> };
  completionRate: number;
  statusBreakdown: { inbox: number; planned: number; in_progress: number; blocked: number; done: number };
  priorityBreakdown: { low: number; medium: number; high: number };
  topTags: Array<{ tag: string; count: number }>;
  dailyBreakdown: Array<{ date: string; created: number; completed: number }>;
  activitySummary: { total: number; taskCreated: number; taskCompleted: number; taskMoved: number; agentHeartbeat: number };
  currentStreak: number;
}

export default function WeeklyReportPanel() {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weekly-report?offset=${weekOffset}`);
      if (response.status === 401) {
        setError('Please log in to view weekly reports');
        return;
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load weekly report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchWeeklyReport();
  }, [fetchWeeklyReport]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const maxDaily = Math.max(
    ...data.dailyBreakdown.map(d => Math.max(d.created, d.completed)),
    1
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Weekly Report
          </h2>
          <p className="text-sm text-gray-500">
            {formatDate(data.weekRange.start)} - {formatDate(data.weekRange.end)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            {weekOffset === 0 ? 'This Week' : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
          </span>
          <button
            onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
            title="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold">{data.tasksCompleted.count}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Created</span>
          </div>
          <p className="text-2xl font-bold">{data.tasksCreated.count}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold">{data.completionRate}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-2xl font-bold">{data.currentStreak} days</p>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Daily Activity</h3>
        <div className="flex items-end justify-between gap-1 h-24">
          {data.dailyBreakdown.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5 h-full justify-end">
                <div
                  className="w-full bg-green-400 rounded-t"
                  style={{ height: `${(day.completed / maxDaily) * 100}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                  title={`${day.completed} completed`}
                />
                <div
                  className="w-full bg-blue-400 rounded-t"
                  style={{ height: `${(day.created / maxDaily) * 100}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                  title={`${day.created} created`}
                />
              </div>
              <span className="text-xs text-gray-500">{getDayName(day.date)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            <span className="text-xs text-gray-500">Created</span>
          </div>
        </div>
      </div>

      {/* Status & Priority Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Status Overview</h3>
          <div className="space-y-2">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Priority Distribution</h3>
          <div className="space-y-2">
            {Object.entries(data.priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm capitalize">{priority}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(count / Object.values(data.priorityBreakdown).reduce((a, b) => a + b, 0)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tags */}
      {data.topTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Top Tags</h3>
          <div className="flex flex-wrap gap-2">
            {data.topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag} <span className="text-gray-500">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Tasks */}
      {data.tasksCompleted.tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Recently Completed</h3>
          <ul className="space-y-1">
            {data.tasksCompleted.tasks.slice(0, 5).map((task) => (
              <li key={task.id} className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="truncate">{task.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
