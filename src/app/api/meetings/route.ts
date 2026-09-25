/**
 * Importers/Callers: office meeting UI, external clients, and Vitest route suite
 * Affected API: GET/POST /api/meetings
 * Data Schemas: Prisma Meeting and MeetingMember records
 * User Instruction: "continue"
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createMeeting } from '@/lib/runtime/meeting-protocol';

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    include: { members: { include: { agent: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ meetings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, topic, participantIds } = body;

  if (typeof title !== 'string' || !title.trim() || typeof topic !== 'string' || !topic.trim() || !Array.isArray(participantIds)) {
    return NextResponse.json(
      { error: 'title, topic, and participantIds are required' },
      { status: 400 },
    );
  }

  try {
    const meeting = await createMeeting({ title, topic, participantIds });
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
