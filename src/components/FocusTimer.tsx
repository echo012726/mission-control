'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TimerState, 
  TimerSettings, 
  DEFAULT_SETTINGS, 
  formatTime, 
  getModeInfo, 
  getNextMode,
  saveTimerState,
  loadTimerState,
  getTodayStats,
  saveDailyStats,
  DailyStats,
  TimerMode
} from '@/lib/timer';

interface FocusTimerProps {
  embedded?: boolean;
  taskId?: string;
}

export default function FocusTimer({ embedded = false, taskId }: FocusTimerProps) {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<TimerState>({
    mode: 'work',
    timeRemaining: DEFAULT_SETTINGS.workDuration,
    isRunning: false,
    sessionsCompleted: 0,
    currentTaskId: taskId,
  });
  const [todayStats, setTodayStats] = useState<DailyStats>({ date: '', sessionsCompleted: 0, totalFocusTime: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationPermission = useRef<NotificationPermission>('default');

  // Load state on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (saved) {
      setSettings(saved.settings);
      setState(prev => ({
        ...prev,
        ...saved.state,
        currentTaskId: taskId || saved.state.currentTaskId,
      }));
    }
    setTodayStats(getTodayStats());
    
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      notificationPermission.current = Notification.permission;
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [taskId]);

  // Save state on change
  useEffect(() => {
    saveTimerState(state, settings);
  }, [state, settings]);

  // Timer tick
  useEffect(() => {
    if (state.isRunning && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
    } else if (state.timeRemaining === 0 && state.isRunning) {
      // Timer completed
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.timeRemaining]);

  const handleTimerComplete = useCallback(() => {
    setState(prev => {
      const newStats = { ...todayStats };
      
      if (prev.mode === 'work') {
        const newSessions = prev.sessionsCompleted + 1;
        newStats.sessionsCompleted = newSessions;
        newStats.totalFocusTime += settings.workDuration;
        setTodayStats(newStats);
        saveDailyStats(newStats);
        
        // Send notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Focus Session Complete! 🎉', {
            body: `You completed ${newSessions} session${newSessions > 1 ? 's' : ''} today. Time for a break!`,
            icon: '/icon.png',
          });
        }
        
        const nextMode = getNextMode(prev.mode, newSessions, settings);
        return {
          ...prev,
          mode: nextMode,
          timeRemaining: nextMode === 'work' ? settings.workDuration : 
                        nextMode === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration,
          isRunning: settings.autoStartBreaks,
          sessionsCompleted: newSessions,
        };
      } else {
        // Break completed
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Break Over! ☕', {
            body: 'Ready to get back to work?',
            icon: '/icon.png',
          });
        }
        
        return {
          ...prev,
          mode: 'work',
          timeRemaining: settings.workDuration,
          isRunning: settings.autoStartWork,
        };
      }
    });
  }, [todayStats, settings]);

  const toggleTimer = () => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.mode === 'work' ? settings.workDuration :
                    prev.mode === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration,
    }));
  };

  const skipPhase = () => {
    setState(prev => {
      const nextMode = getNextMode(prev.mode, prev.sessionsCompleted, settings);
      return {
        ...prev,
        mode: nextMode,
        isRunning: false,
        timeRemaining: nextMode === 'work' ? settings.workDuration :
                      nextMode === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration,
      };
    });
  };

  const modeInfo = getModeInfo(state.mode);
  const progress = state.mode === 'work' 
    ? ((settings.workDuration - state.timeRemaining) / settings.workDuration) * 100
    : state.mode === 'longBreak'
    ? ((settings.longBreakDuration - state.timeRemaining) / settings.longBreakDuration) * 100
    : ((settings.shortBreakDuration - state.timeRemaining) / settings.shortBreakDuration) * 100;

  if (embedded) {
    return (
      <div className="focus-timer-embedded">
        <div className="timer-display" style={{ color: modeInfo.color }}>
          {formatTime(state.timeRemaining)}
        </div>
        <style jsx>{`
          .focus-timer-embedded {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .timer-display {
            font-size: 24px;
            font-weight: 700;
            font-family: monospace;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="focus-timer">
      <div className="timer-header">
        <span className="mode-badge" style={{ backgroundColor: modeInfo.color }}>
          {modeInfo.icon} {modeInfo.label}
        </span>
        <span className="session-count">
          Session {state.sessionsCompleted + 1}/{settings.sessionsUntilLongBreak}
        </span>
      </div>

      <div className="timer-circle" style={{ '--progress': `${progress}%`, '--color': modeInfo.color } as any}>
        <div className="timer-display">
          {formatTime(state.timeRemaining)}
        </div>
      </div>

      <div className="timer-controls">
        <button 
          className={`btn ${state.isRunning ? 'pause' : 'start'}`}
          onClick={toggleTimer}
        >
          {state.isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="btn reset" onClick={resetTimer}>
          ↺ Reset
        </button>
        <button className="btn skip" onClick={skipPhase}>
          ⏭ Skip
        </button>
      </div>

      <div className="timer-stats">
        <div className="stat">
          <span className="stat-value">{todayStats.sessionsCompleted}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat">
          <span className="stat-value">{Math.floor(todayStats.totalFocusTime / 60)}</span>
          <span className="stat-label">Minutes</span>
        </div>
      </div>

      <style jsx>{`
        .focus-timer {
          background: var(--card-bg, #1e1e2e);
          border-radius: 16px;
          padding: 24px;
          max-width: 320px;
          margin: 0 auto;
        }
        .timer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .mode-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: white;
        }
        .session-count {
          color: var(--text-secondary, #888);
          font-size: 13px;
        }
        .timer-circle {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 24px;
          border-radius: 50%;
          background: conic-gradient(
            var(--color) var(--progress),
            var(--card-bg-secondary, #2a2a3e) var(--progress)
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timer-circle::before {
          content: '';
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: var(--card-bg, #1e1e2e);
        }
        .timer-display {
          position: relative;
          font-size: 48px;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
          color: var(--text-primary, #fff);
        }
        .timer-controls {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 24px;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn.start {
          background: #22C55E;
          color: white;
        }
        .btn.pause {
          background: #F59E0B;
          color: white;
        }
        .btn.reset {
          background: #4B5563;
          color: white;
        }
        .btn.skip {
          background: #6B7280;
          color: white;
        }
        .btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .timer-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #333);
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary, #fff);
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-secondary, #888);
        }
      `}</style>
    </div>
  );
}
