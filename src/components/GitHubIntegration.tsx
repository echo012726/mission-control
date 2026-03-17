'use client';

import { useState, useEffect } from 'react';

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  isPR: boolean;
  merged?: boolean;
  draft?: boolean;
  user: {
    login: string;
    avatarUrl: string;
  };
  labels: string[];
}

interface GitHubIntegrationProps {
  userId: string;
  taskId?: string;
  linkedUrl?: string;
  onLink?: (url: string) => void;
  onUnlink?: () => void;
}

export default function GitHubIntegration({ 
  userId, 
  taskId, 
  linkedUrl, 
  onLink, 
  onUnlink 
}: GitHubIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState(linkedUrl || '');
  const [issue, setIssue] = useState<GitHubIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [userId]);

  useEffect(() => {
    if (linkedUrl) {
      setIssueUrl(linkedUrl);
      fetchIssueStatus(linkedUrl);
    }
  }, [linkedUrl]);

  const checkConnection = async () => {
    try {
      const response = await fetch(`/api/github/repos?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.repos) {
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error('Error checking GitHub connection:', err);
    }
  };

  const connectGitHub = async () => {
    try {
      const response = await fetch('/api/github/auth');
      const data = await response.json();
      if (data.authUrl) {
        // In production, redirect to GitHub OAuth
        // For now, simulate connection
        setIsConnected(true);
        setUsername('demo-user');
      }
    } catch (err) {
      setError('Failed to connect to GitHub');
    }
  };

  const disconnectGitHub = () => {
    setIsConnected(false);
    setUsername(null);
    setAvatarUrl(null);
    setIssue(null);
  };

  const fetchIssueStatus = async (url: string) => {
    if (!url) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/issues?url=${encodeURIComponent(url)}&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setIssue(data);
      } else {
        setError(data.error || 'Failed to fetch issue');
        setIssue(null);
      }
    } catch (err) {
      setError('Failed to fetch issue status');
      setIssue(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = () => {
    if (issueUrl && onLink) {
      onLink(issueUrl);
      fetchIssueStatus(issueUrl);
    }
  };

  const handleUnlink = () => {
    setIssueUrl('');
    setIssue(null);
    if (onUnlink) {
      onUnlink();
    }
  };

  const getStatusBadge = () => {
    if (!issue) return null;

    const stateColors: Record<string, string> = {
      open: '#2ea44f',
      closed: '#8250df',
      merged: '#8250df',
      ready: '#2ea44f',
    };

    const state = issue.merged ? 'merged' : issue.state;
    const color = stateColors[state] || '#666';
    const label = issue.isPR 
      ? (issue.merged ? 'Merged' : issue.draft ? 'Draft' : 'PR')
      : (state === 'open' ? 'Open' : 'Closed');

    return (
      <span 
        className="github-status-badge"
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {issue.isPR && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
          </svg>
        )}
        {label}
      </span>
    );
  };

  return (
    <div className="github-integration">
      {!isConnected ? (
        <button
          onClick={connectGitHub}
          className="github-connect-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#24292f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Connect GitHub
        </button>
      ) : (
        <div className="github-connected" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {avatarUrl && (
              <img src={avatarUrl} alt={username || ''} style={{ width: 24, height: 24, borderRadius: '50%' }} />
            )}
            <span style={{ fontSize: '13px', color: '#666' }}>@{username}</span>
            <button
              onClick={disconnectGitHub}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: 'auto',
              }}
            >
              Disconnect
            </button>
          </div>

          {issue && (
            <div className="github-issue-info" style={{
              backgroundColor: '#f6f8fa',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusBadge()}
                <a 
                  href={issue.htmlUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: '#0969da', textDecoration: 'none' }}
                >
                  #{issue.number}
                </a>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {issue.title}
              </div>
              {issue.labels.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {issue.labels.map((label: string) => (
                    <span 
                      key={label}
                      style={{
                        backgroundColor: '#ddf4ff',
                        color: '#0969da',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={handleUnlink}
                style={{
                  background: 'none',
                  border: '1px solid #d0d7de',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#666',
                  alignSelf: 'flex-start',
                }}
              >
                Unlink
              </button>
            </div>
          )}

          {!issue && (
            <div className="link-issue" style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={issueUrl}
                onChange={(e) => setIssueUrl(e.target.value)}
                placeholder="Paste GitHub issue/PR URL..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={handleLink}
                disabled={!issueUrl || loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: issueUrl && !loading ? '#2ea44f' : '#94d3a2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: issueUrl && !loading ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {loading ? 'Loading...' : 'Link'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ color: '#cf222e', fontSize: '12px' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
