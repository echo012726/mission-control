import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your_client_id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'your_client_secret';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/github/callback';

export async function GET() {
  const scopes = ['repo', 'read:user', 'user:email'];
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${encodeURIComponent(scopes.join(' '))}`;
  
  return NextResponse.json({ authUrl });
}
