'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Calendar, ArrowRight, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdAt?: string;
}

interface GanttViewProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

export default function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Calculate date range for the timeline
  const { startDate, endDate, days } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7); // Start from 7 days ago
    
    const end = new Date(today);
    end.setDate(end.getDate() + (viewMode === 'week' ? 14 : 45)); // 2 weeks or 6 weeks ahead
    
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const days: Date[] = [];
    
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    
    return { startDate: start, endDate: end, days };
  }, [viewMode]);

  // Filter and sort tasks with due dates
  const tasksWithDates = useMemo(() => {
    return tasks
      .filter(task => task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!).getTime();
        const dateB = new Date(b.dueDate!).getTime();
        return dateA - dateB;
      });
  }, [tasks]);

  // Get tasks grouped by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      'inbox': [],
      'planned': [],
      'in_progress': [],
      'blocked': [],
      'done': []
    };
    
    tasksWithDates.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    
    return grouped;
  }, [tasksWithDates]);

  // Check if a date falls within the visible range
  const isDateVisible = (date: Date) => {
    return date >= startDate && date <= endDate;
  };

  // Get position and width for task bar
  const getTaskBarStyle = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    if (!isDateVisible(due)) return null;
    
    const daysDiff = Math.floor((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const left = daysDiff * 40; // 40px per day
    const width = 32; // Fixed width for task bars
    
    return {
      left: `${left}px`,
      width: `${width}px`
    };
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  // Format date header
  const formatDayHeader = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const formatDateHeader = (date: Date) => {
    return date.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const overdue = tasksWithDates.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    const dueThisWeek = tasksWithDates.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const due = new Date(t.dueDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return due >= new Date() && due <= weekFromNow;
    }).length;
    
    const completed = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    
    return { overdue, dueThisWeek, completed, total };
  }, [tasks, tasksWithDates]);

  return (
    <div className="gantt-view bg-gray-900 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline View
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            2 Weeks
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            6 Weeks
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">{stats.dueThisWeek}</div>
          <div className="text-xs text-gray-400">Due This Week</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-xs text-gray-400">Overdue</div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <div className="w-48 flex-shrink-0 p-2 text-sm font-medium text-gray-400 border-r border-gray-700">
            Task
          </div>
          <div className="flex-1 flex">
            {days.map((day, idx) => (
              <div 
                key={idx} 
                className={`flex-shrink-0 p-1 text-center border-r border-gray-700 ${
                  isWeekend(day) ? 'bg-gray-800' : 'bg-gray-750'
                } ${isToday(day) ? 'bg-indigo-900/50' : ''}`}
                style={{ width: '40px' }}
              >
                <div className="text-xs text-gray-400">{formatDayHeader(day)}</div>
                <div className={`text-sm font-medium ${isToday(day) ? 'text-indigo-400' : 'text-gray-300'}`}>
                  {formatDateHeader(day)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        {tasksWithDates.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks with due dates</p>
            <p className="text-sm">Add due dates to your tasks to see them here</p>
          </div>
        ) : (
          tasksWithDates.map(task => {
            const barStyle = getTaskBarStyle(task.dueDate);
            
            return (
              <div 
                key={task.id} 
                className="flex border-b border-gray-700 hover:bg-gray-800/50"
              >
                {/* Task Name */}
                <div 
                  className="w-48 flex-shrink-0 p-2 border-r border-gray-700 cursor-pointer"
                  onClick={() => onTaskClick?.(task.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    <span className="text-sm text-white truncate">{task.title}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </div>
                </div>
                
                {/* Timeline Cells */}
                <div className="flex-1 flex relative h-12">
                  {/* Grid lines */}
                  {days.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 border-r border-gray-700/50 ${
                        isWeekend(day) ? 'bg-gray-800/30' : ''
                      } ${isToday(day) ? 'bg-indigo-900/20' : ''}`}
                      style={{ width: '40px' }}
                    />
                  ))}
                  
                  {/* Task Bar */}
                  {barStyle && (
                    <div
                      className={`absolute top-2 h-8 rounded ${getPriorityColor(task.priority)} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
                      style={{
                        left: barStyle.left,
                        width: barStyle.width
                      }}
                      onClick={() => onTaskClick?.(task.id)}
                      title={`${task.title} - Due: ${new Date(task.dueDate!).toLocaleDateString()}`}
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Low Priority</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Clock className="w-4 h-4" />
          <span>Today highlighted</span>
        </div>
      </div>
    </div>
  );
}
