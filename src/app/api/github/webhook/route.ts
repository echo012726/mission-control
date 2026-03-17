import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');
  const body = await request.text();

  // Verify webhook signature (in production, use GITHUB_WEBHOOK_SECRET)
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    if (!verifySignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(body);

    // Handle different GitHub events
    switch (event) {
      case 'issues':
        await handleIssueEvent(payload);
        break;
      case 'pull_request':
        await handlePullRequestEvent(payload);
        break;
      case 'issue_comment':
        await handleIssueCommentEvent(payload);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleIssueEvent(payload: any) {
  const { action, issue, repository } = payload;
  
  // Find tasks linked to this issue
  const issueUrl = issue.html_url;
  
  const tasks = await prisma.task.findMany({
    where: {
      githubIssueUrl: issueUrl,
    },
  });

  for (const task of tasks) {
    let status = null;
    
    if (action === 'opened' || action === 'reopened') {
      status = 'open';
    } else if (action === 'closed') {
      status = issue.pull_request ? 'merged' : 'closed';
    }

    if (status) {
      await prisma.task.update({
        where: { id: task.id },
        data: { githubStatus: status },
      });
    }
  }
}

async function handlePullRequestEvent(payload: any) {
  const { action, pull_request, repository } = payload;
  
  const prUrl = pull_request.html_url;
  
  const tasks = await prisma.task.findMany({
    where: {
      githubPRUrl: prUrl,
    },
  });

  for (const task of tasks) {
    let status = null;
    
    switch (action) {
      case 'opened':
      case 'reopened':
        status = 'open';
        break;
      case 'closed':
        status = pull_request.merged ? 'merged' : 'closed';
        break;
      case 'ready_for_review':
        status = 'ready';
        break;
    }

    if (status) {
      await prisma.task.update({
        where: { id: task.id },
        data: { githubStatus: status },
      });
    }
  }
}

async function handleIssueCommentEvent(payload: any) {
  // Could add notifications for comments on linked issues
  console.log('Issue comment:', payload.comment?.body);
}
