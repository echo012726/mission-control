# SPEC.md - Slack Commands

## Feature Overview
- **Feature Name:** Slack Commands
- **Type:** New Feature (Phase 2)
- **Core Functionality:** Interact with Mission Control tasks via Slack slash commands
- **Target Users:** Teams using both Slack and Mission Control

## UI/UX Specification

### Layout Structure

**Slack Integration Modal**
- Accessed via: Settings > Integrations > Slack Commands
- Tabbed interface: Commands | Setup | Activity Log
- Contains: Command list, setup instructions, command usage

**Command Reference Panel**
- Quick reference card showing all available commands
- Copy-pasteable command examples

### Visual Design

**Color Palette**
- Primary: `#4A154B` (Slack purple)
- Secondary: `#36C5F0` (Slack blue)
- Accent: `#2EB67D` (Slack green)
- Background: `#1a1a2e` (Dark)
- Surface: `#0f3460`
- Text: `#eaeaea`

**Typography**
- Font: Slack's UI fonts (system fallback)
- Code blocks: Monospace

### Components

**CommandList**
- List of available slash commands
- Each shows: Command syntax, description, example

**SetupInstructions**
- Step-by-step guide to configure Slack integration
- Webhook URL generation
- Slack app configuration

**ActivityLog**
- Table of recent Slack command executions
- Columns: Time, Command, User, Result

## Functionality Specification

### Core Features

1. **Available Slash Commands**

   | Command | Description | Example |
   |---------|-------------|---------|
   | `/mc task create <title>` | Create new task | `/mc task create Review PR #42` |
   | `/mc task list` | List your tasks | `/mc task list` |
   | `/mc task complete <id>` | Mark task complete | `/mc task complete 123` |
   | `/mc task due <id> <date>` | Set due date | `/mc task due 123 tomorrow` |
   | `/mc search <query>` | Search tasks | `/mc search bug` |
   | `/mc help` | Show help | `/mc help` |

2. **Slack App Configuration**
   - Create Slack app with slash commands
   - Configure request URL (Mission Control webhook)
   - Set up OAuth for user authentication
   - Define command arguments and descriptions

3. **Command Parser**
   - Parse command string into action + parameters
   - Support natural language for dates ("tomorrow", "next Friday")
   - Return formatted Slack responses

4. **Webhook Handler**
   - Receive commands from Slack
   - Execute corresponding actions
   - Format and send responses back to Slack

5. **Activity Logging**
   - Log all command executions
   - Store: timestamp, user, command, result
   - Display in Activity Log tab

### User Interactions

- **Setup:** User creates Slack app → Configures commands → Enters webhook URL in Mission Control
- **Usage:** Type slash command in Slack → Receive task response
- **Troubleshooting:** View Activity Log for errors

### Data Handling

**localStorage Schema:**
```json
{
  "slackCommands": {
    "enabled": true,
    "webhookUrl": "https://...",
    "botToken": "xoxb-...",
    "teamId": "T123...",
    "activityLog": [
      {
        "timestamp": "ISO date",
        "command": "/mc task create",
        "userId": "U123",
        "result": "success|error",
        "message": "Task created: #123"
      }
    ]
  }
}
```

### Edge Cases
- Invalid command: Show help message
- Missing permissions: Prompt user to authorize
- Webhook timeout: Show error in activity log
- Rate limiting: Queue requests and retry

## Acceptance Criteria

- [ ] Slack Commands modal accessible from Settings
- [ ] All 6 slash commands implemented with parsers
- [ ] Command responses formatted for Slack (blocks, attachments)
- [ ] Activity log shows last 50 commands
- [ ] Webhook endpoint exists to receive commands
- [ ] Setup instructions clear and complete
- [ ] Works with existing Slack integration (enhanced)
- [ ] Error handling for invalid commands
- [ ] Confirmation for destructive actions (delete)
