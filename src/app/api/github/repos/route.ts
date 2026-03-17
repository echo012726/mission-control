import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const githubAccount = await prisma.gitHubAccount.findUnique({
      where: { userId },
    });

    if (!githubAccount) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    // Fetch user's repositories
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${githubAccount.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch repos' }, { status: response.status });
    }

    const repos = await response.json();
    
    return NextResponse.json({ 
      repos: repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
      }))
    });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
