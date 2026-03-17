'use client';

import { useState, useEffect } from 'react';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  linkedTasks: string;
  streak: number;
  bestStreak: number;
  createdAt: string;
  completions: HabitCompletion[];
  completionsLast7: number;
  completionsLast30: number;
  completionRate7: number;
  completionRate30: number;
}

interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  source: string;
}

interface Analytics {
  totalHabits: number;
  avgStreak: number;
  totalCompletionsLast7: number;
  avgCompletionRate7: number;
  bestHabit: { name: string; streak: number } | null;
  worstHabit: { name: string; streak: number } | null;
  weeklyData: { date: string; dayName: string; completions: number }[];
}

const ICONS = ['⭐', '🔥', '💪', '🎯', '📚', '🏃', '💧', '🧘', '✍️', '🎵', '💤', '🥗'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐', color: '#6366f1', frequency: 'daily' });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const [habitsRes, analyticsRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/habits/analytics'),
      ]);
      const habitsData = await habitsRes.json();
      const analyticsData = await analyticsRes.json();
      setHabits(habitsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabit.name.trim()) return;
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit),
      });
      if (res.ok) {
        setShowModal(false);
        setNewHabit({ name: '', icon: '⭐', color: '#6366f1', frequency: 'daily' });
        fetchHabits();
      }
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const completeHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual' }),
      });
      if (res.ok) {
        fetchHabits();
      }
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit?')) return;
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHabits();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const isCompletedToday = (habit: Habit) => {
    const today = new Date().toDateString();
    return habit.completions.some(c => new Date(c.completedAt).toDateString() === today);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
        >
          + New Habit
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Habits</div>
            <div className="text-2xl font-bold">{analytics.totalHabits}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Avg Streak</div>
            <div className="text-2xl font-bold">{analytics.avgStreak} days</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">This Week</div>
            <div className="text-2xl font-bold">{analytics.totalCompletionsLast7} completions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="text-2xl font-bold">{analytics.avgCompletionRate7}%</div>
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      {analytics && analytics.weeklyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Weekly Progress</h2>
          <div className="flex justify-between items-end h-32 gap-2">
            {analytics.weeklyData.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-indigo-500 rounded-t"
                  style={{ height: `${Math.min(day.completions * 20, 100)}%` }}
                ></div>
                <div className="text-xs mt-2 text-gray-500">{day.dayName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-2 ${
              isCompletedToday(habit) ? 'border-green-500' : 'border-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{habit.icon}</span>
                <div>
                  <h3 className="font-semibold">{habit.name}</h3>
                  <span className="text-xs text-gray-500">{habit.frequency}</span>
                </div>
              </div>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">🔥</span>
                <span className="font-bold">{habit.streak}</span>
                <span className="text-xs text-gray-500">day streak</span>
              </div>
              {habit.bestStreak > 0 && (
                <span className="text-xs text-gray-500">Best: {habit.bestStreak}</span>
              )}
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>7-day rate</span>
                <span>{habit.completionRate7}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${habit.completionRate7}%`, backgroundColor: habit.color }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => !isCompletedToday(habit) && completeHabit(habit.id)}
              disabled={isCompletedToday(habit)}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                isCompletedToday(habit)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {isCompletedToday(habit) ? '✓ Completed Today' : 'Mark Complete'}
            </button>
          </div>
        ))}

        {habits.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No habits yet. Create your first habit to get started!
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Drink water"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`text-xl p-2 rounded ${
                        newHabit.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`w-8 h-8 rounded-full ${
                        newHabit.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createHabit}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
