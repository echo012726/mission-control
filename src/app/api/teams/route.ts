import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/teams - List all teams
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        _count: { select: { sharedTasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, members } = body;

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        members: members ? {
          create: members.map((m: { userId: string; name: string; role?: string }) => ({
            userId: m.userId,
            name: m.name,
            role: m.role || 'owner'
          }))
        } : undefined
      },
      include: { members: true }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
