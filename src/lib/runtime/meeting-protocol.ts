/**
 * Importers/Callers: meetings API, runtime tests, office meeting UI
 * Affected API: createMeeting(input), conductMeeting(meetingId, deliberator)
 * Data Schemas: Prisma Meeting, MeetingMember, and Agent records
 * User Instruction: "continue"
 */
import type { Agent } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface CreateMeetingInput {
  title: string;
  topic: string;
  participantIds: string[];
}

export interface MeetingDeliberator {
  getPosition(agent: Agent, topic: string): Promise<string>;
  synthesize(topic: string, positions: string[]): Promise<string>;
}

export async function createMeeting(input: CreateMeetingInput) {
  const participantIds = [...new Set(input.participantIds)];
  if (participantIds.length === 0) throw new Error('At least one participant is required');

  const agents = await prisma.agent.findMany({ where: { id: { in: participantIds } } });
  const foundIds = new Set(agents.map((agent) => agent.id));
  const missingIds = participantIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) throw new Error(`Unknown meeting participants: ${missingIds.join(', ')}`);

  return prisma.meeting.create({
    data: {
      title: input.title,
      topic: input.topic,
      status: 'pending',
      members: {
        create: participantIds.map((agentId) => ({ agentId })),
      },
    },
    include: { members: true },
  });
}

export async function conductMeeting(meetingId: string, deliberator: MeetingDeliberator) {
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    include: { members: { include: { agent: true }, orderBy: { joinedAt: 'asc' } } },
  });
  if (meeting.members.length === 0) throw new Error('Meeting has no participants');

  await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'in_progress' } });

  try {
    const positions: string[] = [];
    for (const member of meeting.members) {
      positions.push(await deliberator.getPosition(member.agent, meeting.topic));
    }
    const consensus = await deliberator.synthesize(meeting.topic, positions);
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'completed', consensus },
    });
    return { meetingId, positions, consensus };
  } catch (error) {
    await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'failed' } });
    throw error;
  }
}
