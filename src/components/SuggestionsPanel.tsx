'use client';

import { useState, useEffect, useCallback } from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  karma?: number;
  dependsOn?: string[];
  createdAt?: string;
}

interface TaskSuggestion {
  taskId: string;
  title: string;
  reason: string;
  priority: number;
  score: number;
  suggestedAction: 'work_on' | 'schedule' | 'delegate' | 'break' | 'complete';
  estimatedMinutes?: number;
}

interface SuggestionsPanelProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
}

export default function SuggestionsPanel({ tasks, onTaskClick, onStartTimer }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Calculate context
  const getContext = useCallback(() => {
    const now = new Date();
    const completedToday = tasks.filter(t => {
      if (t.status !== 'done' && t.status !== 'completed') return false;
      // In real app, check if completed today
      return true;
    }).length;

    return {
      currentHour: now.getHours(),
      dayOfWeek: now.getDay(),
      completedToday,
      totalTasks: tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length,
      focusScore: 50 // Could track this over time
    };
  }, [tasks]);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks,
            context: getContext()
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.suggestions || []);
          setInsight(data.insight || '');
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tasks.length > 0) {
      fetchSuggestions();
    }
  }, [tasks, getContext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
        const suggestion = suggestions[selectedIndex];
        if (suggestion.taskId !== 'start-day' && suggestion.taskId !== 'take-break') {
          onTaskClick?.(suggestion.taskId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onTaskClick]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'work_on': return '🎯';
      case 'schedule': return '📅';
      case 'delegate': return '👥';
      case 'break': return '☕';
      case 'complete': return '✅';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'text-red-400';
      case 3: return 'text-orange-400';
      case 2: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <h3>🤖 AI Suggestions</h3>
        </div>
        <div className="suggestions-loading">
          <span className="loading-spinner"></span>
          Analyzing your tasks...
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <h3>🤖 AI Suggestions</h3>
        </div>
        <div className="suggestions-empty">
          <p>No tasks to analyze. Add some tasks to get AI-powered suggestions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-panel">
      <div className="suggestions-header">
        <h3>🤖 AI Suggestions</h3>
        <span className="suggestions-count">{suggestions.length} ideas</span>
      </div>
      
      {insight && (
        <div className="ai-insight">
          💡 {insight}
        </div>
      )}
      
      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.taskId}
            className={`suggestion-item ${index === selectedIndex ? 'selected' : ''} ${
              suggestion.taskId === 'take-break' ? 'break-suggestion' : ''
            } ${suggestion.taskId === 'start-day' ? 'start-suggestion' : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              if (suggestion.taskId !== 'start-day' && suggestion.taskId !== 'take-break') {
                onTaskClick?.(suggestion.taskId);
              }
            }}
          >
            <div className="suggestion-action">
              {getActionIcon(suggestion.suggestedAction)}
            </div>
            <div className="suggestion-content">
              <div className="suggestion-title">{suggestion.title}</div>
              <div className="suggestion-reason">{suggestion.reason}</div>
              {suggestion.estimatedMinutes && suggestion.estimatedMinutes > 0 && (
                <div className="suggestion-time">
                  ⏱️ ~{suggestion.estimatedMinutes} min
                </div>
              )}
            </div>
            <div className={`suggestion-score ${getPriorityColor(suggestion.priority)}`}>
              {suggestion.score}
            </div>
          </div>
        ))}
      </div>
      
      <div className="suggestions-footer">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
      </div>

      <style jsx>{`
        .suggestions-panel {
          background: var(--card-bg, #1e1e2e);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .suggestions-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .suggestions-count {
          font-size: 12px;
          color: var(--text-muted, #888);
        }

        .ai-insight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          font-size: 13px;
          color: white;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary, #2a2a3e);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .suggestion-item:hover {
          background: var(--bg-hover, #3a3a4e);
        }

        .suggestion-item.selected {
          border-color: #667eea;
          background: var(--bg-selected, #3a3a5e);
        }

        .suggestion-item.break-suggestion {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .suggestion-item.start-suggestion {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .suggestion-action {
          font-size: 20px;
        }

        .suggestion-content {
          flex: 1;
        }

        .suggestion-title {
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .suggestion-reason {
          font-size: 12px;
          color: var(--text-muted, #aaa);
        }

        .suggestion-time {
          font-size: 11px;
          color: var(--text-muted, #888);
          margin-top: 4px;
        }

        .suggestion-score {
          font-weight: 700;
          font-size: 16px;
          min-width: 32px;
          text-align: center;
        }

        .suggestions-footer {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #3a3a4e);
          font-size: 11px;
          color: var(--text-muted, #888);
        }

        .suggestions-loading,
        .suggestions-empty {
          text-align: center;
          padding: 20px;
          color: var(--text-muted, #888);
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-color, #3a3a4e);
          border-radius: 50%;
          border-top-color: #667eea;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
