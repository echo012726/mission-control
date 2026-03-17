// Focus Timer - Pomodoro-style productivity timer

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  sessionsCompleted: number;
  currentTaskId?: string;
}

export interface TimerSettings {
  workDuration: number; // 25 min default
  shortBreakDuration: number; // 5 min
  longBreakDuration: number; // 15 min
  sessionsUntilLongBreak: number; // 4
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
};

export interface FocusSession {
  id: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  mode: TimerMode;
  completed: boolean;
}

// Get mode display info
export function getModeInfo(mode: TimerMode) {
  switch (mode) {
    case 'work':
      return { label: 'Focus Time', color: '#EF4444', icon: '🎯' };
    case 'shortBreak':
      return { label: 'Short Break', color: '#22C55E', icon: '☕' };
    case 'longBreak':
      return { label: 'Long Break', color: '#3B82F6', icon: '🌴' };
  }
}

// Format seconds to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate next mode based on current state
export function getNextMode(currentMode: TimerMode, sessionsCompleted: number, settings: TimerSettings): TimerMode {
  if (currentMode === 'work') {
    const nextSession = sessionsCompleted + 1;
    if (nextSession % settings.sessionsUntilLongBreak === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }
  return 'work';
}

// Generate unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// LocalStorage keys
export const TIMER_STORAGE_KEY = 'mc_timer_state';
export const TIMER_STATS_KEY = 'mc_timer_stats';

// Save timer state to localStorage
export function saveTimerState(state: TimerState, settings: TimerSettings): void {
  if (typeof window === 'undefined') return;
  const data = { state, settings, savedAt: Date.now() };
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(data));
}

// Load timer state from localStorage
export function loadTimerState(): { state: TimerState; settings: TimerSettings } | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    // Calculate elapsed time if timer was running
    if (data.state.isRunning && data.savedAt) {
      const elapsed = Math.floor((Date.now() - data.savedAt) / 1000);
      data.state.timeRemaining = Math.max(0, data.state.timeRemaining - elapsed);
    }
    return data;
  } catch {
    return null;
  }
}

// Daily stats management
export interface DailyStats {
  date: string;
  sessionsCompleted: number;
  totalFocusTime: number; // seconds
}

export function saveDailyStats(stats: DailyStats): void {
  if (typeof window === 'undefined') return;
  const key = `${TIMER_STATS_KEY}_${stats.date}`;
  localStorage.setItem(key, JSON.stringify(stats));
}

export function getTodayStats(): DailyStats {
  if (typeof window === 'undefined') return { date: getTodayDate(), sessionsCompleted: 0, totalFocusTime: 0 };
  
  const key = `${TIMER_STATS_KEY}_${getTodayDate()}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { date: getTodayDate(), sessionsCompleted: 0, totalFocusTime: 0 };
    }
  }
  return { date: getTodayDate(), sessionsCompleted: 0, totalFocusTime: 0 };
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
