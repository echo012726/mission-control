import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Parse GitHub URL to extract owner, repo, and issue number
function parseGitHubUrl(url: string): { owner: string; repo: string; number: number } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/,
    /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/,
    /^([^\/]+)\/([^\/]+)#(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        number: parseInt(match[3], 10),
      };
    }
  }
  return null;
}

// GET - Fetch issue/PR status
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!url || !userId) {
    return NextResponse.json({ error: 'URL and userId required' }, { status: 400 });
  }

  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const githubAccount = await prisma.gitHubAccount.findUnique({
      where: { userId },
    });

    if (!githubAccount) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const isPR = url.includes('/pull/');
    const apiPath = isPR 
      ? `/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`
      : `/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`;

    const response = await fetch(`https://api.github.com${apiPath}`, {
      headers: {
        'Authorization': `Bearer ${githubAccount.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Issue not found' }, { status: response.status });
    }

    const issue = await response.json();

    return NextResponse.json({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      htmlUrl: issue.html_url,
      isPR,
      merged: issue.merged,
      draft: issue.draft,
      user: {
        login: issue.user.login,
        avatarUrl: issue.user.avatar_url,
      },
      labels: issue.labels.map((l: any) => l.name),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

// POST - Create a new issue
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, owner, repo, title, body: issueBody, labels } = body;

  if (!userId || !owner || !repo || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const githubAccount = await prisma.gitHubAccount.findUnique({
      where: { userId },
    });

    if (!githubAccount) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubAccount.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: issueBody || '',
        labels: labels || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const issue = await response.json();

    return NextResponse.json({
      number: issue.number,
      title: issue.title,
      htmlUrl: issue.html_url,
      state: issue.state,
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
