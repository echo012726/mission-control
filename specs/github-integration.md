# GitHub Integration - Specification

## Overview
Link Mission Control tasks to GitHub issues and PRs for developer workflow integration.

## Features

### 1. OAuth Authentication
- GitHub OAuth 2.0 flow via `/api/auth/github`
- Store access token securely
- Support for GitHub Enterprise (future)

### 2. Task Linking
- Add GitHub issue/PR URL or `owner/repo#number` to task
- Parse and validate GitHub links
- Display linked status on task cards

### 3. Status Sync
- Fetch issue/PR status from GitHub API
- Display status badges (open, closed, merged, draft)
- Auto-update when GitHub status changes (via webhooks)

### 4. Issue Creation
- Create GitHub issue from task
- Pre-fill title, body, labels from task
- Link created issue to task

### 5. Webhooks
- Receive GitHub webhook events
- Update task status based on issue changes
- Notify on PR reviews, merges

## API Endpoints

- `GET /api/github/auth` - OAuth redirect
- `GET /api/github/callback` - OAuth callback
- `POST /api/github/webhook` - GitHub webhook receiver
- `GET /api/github/repos` - List user repos
- `POST /api/github/issues` - Create issue
- `GET /api/github/issues/:owner/:repo/:number` - Get issue status

## Data Model

```prisma
model GitHubAccount {
  id          String   @id @default(cuid())
  userId      String
  githubId    String
  username    String
  accessToken String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Task {
  // ... existing fields
  githubIssueUrl   String?
  githubIssueId   String?
  githubPRUrl     String?
  githubStatus    String?
}
```

## UI Components

1. **GitHubLinkButton** - Button to link/unlink GitHub issues
2. **GitHubStatusBadge** - Shows issue/PR status
3. **GitHubSettingsPanel** - Connect/disconnect GitHub account
4. **CreateIssueModal** - Create GitHub issue from task

## Acceptance Criteria

- [ ] User can connect GitHub account via OAuth
- [ ] User can link task to GitHub issue by URL
- [ ] Linked tasks show GitHub status badge
- [ ] User can create GitHub issue from task
- [ ] Webhooks update task status on GitHub changes
