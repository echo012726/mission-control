import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/teams/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const body = await request.json();
    const { role, name, avatarUrl } = body;

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl })
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    await prisma.teamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
