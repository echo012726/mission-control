# Voice Commands Feature Specification

## Feature: Voice Commands (Speech-to-Task)

### Overview
Add voice command functionality to Mission Control allowing users to create tasks, search, and navigate using speech input. This enables hands-free task management particularly useful for mobile users and those who prefer verbal input.

### Features

#### 1. Voice Input Button
- Microphone button in header and Quick Add modal
- Visual feedback during listening (pulsing animation)
- Support for continuous or single-command modes
- Keyboard shortcut: `V` to toggle voice input

#### 2. Command Recognition
- **Create Task**: "Create task [title]", "Add task [title]", "New task [title]"
- **Set Priority**: "High priority", "Medium priority", "Low priority"
- **Set Due Date**: "Due tomorrow", "Due next Friday", "Due March 15"
- **Add Tags**: "Add tag work", "Tag it urgent"
- **Search**: "Search for [query]", "Find [query]"
- **Navigate**: "Go to calendar", "Show me tasks"
- **Complete Task**: "Complete [task name]", "Mark [task] done"

#### 3. Natural Language Processing
- Parse intent from voice input
- Extract entities: task title, priority, due date, tags
- Handle ambiguous commands with clarification prompts
- Support for compound commands ("Create report due Friday high priority")

#### 4. Visual Feedback
- Real-time transcription display while speaking
- Command confirmation toast after successful execution
- Error messages for unrecognized commands
- Voice input indicator in header (microphone icon)

#### 5. Settings & Preferences
- Language selection (English default, extensible)
- Voice feedback toggle (text-to-speech responses)
- Wake word option ("Hey MC, ...")
- Sensitivity adjustment

### Implementation Approach
- Use Web Speech API (SpeechRecognition) as primary
- Fallback to manual input if API unavailable
- Store preferences in localStorage

### Files to Modify
- `/kanban.html` - Add voice input UI and processing logic
- New: `/src/lib/voiceCommands.ts` - Command parser and recognition handler

### Acceptance Criteria
- [x] Voice button appears in header and Quick Add
- [x] Can create task via voice ("Create task Buy milk")
- [x] Priority can be set via voice ("High priority")
- [x] Due dates parsed correctly ("Due tomorrow")
- [x] Tags can be added via voice ("Tag work")
- [x] Search works via voice ("Search for meeting")
- [x] Visual feedback during listening state
- [x] Graceful fallback when Speech API unavailable

### Status: IMPLEMENTED (March 14, 2026)

### Priority: HIGH
Voice input is a significant accessibility and productivity enhancement, especially for mobile users.
