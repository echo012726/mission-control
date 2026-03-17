'use client';

import { useState, useEffect, useRef } from 'react';
import { parseNaturalDate, formatParsedDate, mightHaveDate } from '@/lib/dateParser';

interface Task {
  id?: string;
  title: string;
  date?: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  status?: string;
}

interface QuickAddProps {
  onAddTask: (task: Task) => void;
  placeholder?: string;
}

export default function QuickAdd({ onAddTask, placeholder = 'Add a task... (try "Buy milk tomorrow at 5pm")' }: QuickAddProps) {
  const [input, setInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ReturnType<typeof parseNaturalDate> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse input as user types
  useEffect(() => {
    if (input.trim() && mightHaveDate(input)) {
      const result = parseNaturalDate(input);
      setParsedResult(result);
      setShowPreview(result.hasDate || result.time !== null);
    } else {
      setParsedResult(null);
      setShowPreview(false);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const parsed = parseNaturalDate(input);
    
    const task: Task = {
      title: parsed.remaining || input,
      date: parsed.date ? parsed.date.toISOString().split('T')[0] : undefined,
      time: parsed.time || undefined,
      priority: 'medium',
      status: 'todo'
    };
    
    onAddTask(task);
    setInput('');
    setParsedResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="quick-add-container">
      <form onSubmit={handleSubmit} className="quick-add-form">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="quick-add-input"
            autoComplete="off"
          />
          
          {/* Parsed Date Preview */}
          {showPreview && parsedResult && parsedResult.hasDate && (
            <div className="date-preview">
              <span className="preview-icon">📅</span>
              <span className="preview-text">
                {formatParsedDate(parsedResult.date!)}
              </span>
            </div>
          )}
          
          {/* Time-only preview */}
          {showPreview && parsedResult && parsedResult.time && !parsedResult.hasDate && (
            <div className="date-preview time-only">
              <span className="preview-icon">⏰</span>
              <span className="preview-text">
                Today at {parsedResult.time}
              </span>
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="quick-add-button"
          disabled={!input.trim()}
        >
          <span className="button-icon">+</span>
          <span className="button-text">Add</span>
        </button>
      </form>
      
      {/* Keyboard shortcuts hint */}
      {isFocused && (
        <div className="quick-add-hints">
          <span className="hint">Press <kbd>Enter</kbd> to add</span>
          <span className="hint-divider">|</span>
          <span className="hint">Try: "Buy milk tomorrow at 5pm"</span>
        </div>
      )}
      
      <style jsx>{`
        .quick-add-container {
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .quick-add-form {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        
        .input-wrapper {
          flex: 1;
          position: relative;
        }
        
        .quick-add-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .quick-add-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .quick-add-input::placeholder {
          color: #94a3b8;
        }
        
        .date-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          margin-top: 0.5rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #166534;
        }
        
        .date-preview.time-only {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
        }
        
        .preview-icon {
          font-size: 1rem;
        }
        
        .preview-text {
          font-weight: 500;
        }
        
        .quick-add-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        
        .quick-add-button:hover:not(:disabled) {
          background: #4f46e5;
        }
        
        .quick-add-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .quick-add-button:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        
        .button-icon {
          font-size: 1.25rem;
          font-weight: bold;
        }
        
        .quick-add-hints {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .hint kbd {
          padding: 0.125rem 0.375rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.7rem;
        }
        
        .hint-divider {
          color: #cbd5e1;
        }
        
        @media (max-width: 640px) {
          .quick-add-form {
            flex-direction: column;
          }
          
          .quick-add-button {
            width: 100%;
            justify-content: center;
          }
          
          .button-text {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}
