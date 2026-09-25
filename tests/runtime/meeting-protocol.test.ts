/**
 * Importers/Callers: Vitest runtime suite; exercises src/lib/runtime/meeting-protocol.ts
 * Affected API: createMeeting(input), conductMeeting(meetingId, deliberator)
 * Data Schemas: Prisma Meeting, MeetingMember, and Agent records
 * User Instruction: "continue"
 */
import { afterEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/db/prisma';
import { conductMeeting, createMeeting } from '../../src/lib/runtime/meeting-protocol';

const agentIds: string[] = [];
const meetingIds: string[] = [];

afterEach(async () => {
  await prisma.meetingMember.deleteMany({ where: { meetingId: { in: meetingIds } } });
  await prisma.meeting.deleteMany({ where: { id: { in: meetingIds } } });
  await prisma.agent.deleteMany({ where: { id: { in: agentIds } } });
  agentIds.length = 0;
  meetingIds.length = 0;
});

async function createAgent(name: string) {
  const agent = await prisma.agent.create({
    data: {
      name,
      role: 'Reviewer',
      systemPrompt: 'Review proposals.',
      provider: 'openclaude',
      model: 'test-model',
      avatar: name.toLowerCase(),
    },
  });
  agentIds.push(agent.id);
  return agent;
}

describe('Meeting Protocol', () => {
  it('creates a meeting with unique validated participants', async () => {
    const first = await createAgent('First');
    const second = await createAgent('Second');

    const meeting = await createMeeting({
      title: 'Architecture review',
      topic: 'Choose the storage strategy',
      participantIds: [first.id, second.id, first.id],
    });
    meetingIds.push(meeting.id);

    expect(meeting.status).toBe('pending');
    expect(meeting.members.map((member) => member.agentId).sort()).toEqual(
      [first.id, second.id].sort(),
    );
  });

  it('rejects unknown participants without creating a partial meeting', async () => {
    await expect(createMeeting({
      title: 'Invalid meeting',
      topic: 'Missing participant',
      participantIds: ['missing-agent'],
    })).rejects.toThrow('Unknown meeting participants: missing-agent');

    expect(await prisma.meeting.count({ where: { title: 'Invalid meeting' } })).toBe(0);
  });

  it('collects participant positions and persists synthesized consensus', async () => {
    const first = await createAgent('First');
    const second = await createAgent('Second');
    const meeting = await createMeeting({
      title: 'Architecture review',
      topic: 'Choose the storage strategy',
      participantIds: [first.id, second.id],
    });
    meetingIds.push(meeting.id);

    const result = await conductMeeting(meeting.id, {
      getPosition: async (agent, topic) => `${agent.name} position on ${topic}`,
      synthesize: async (_topic, positions) => `Consensus: ${positions.join(' | ')}`,
    });

    const persisted = await prisma.meeting.findUniqueOrThrow({ where: { id: meeting.id } });
    expect(result.positions).toEqual([
      'First position on Choose the storage strategy',
      'Second position on Choose the storage strategy',
    ]);
    expect(persisted.status).toBe('completed');
    expect(persisted.consensus).toBe(
      'Consensus: First position on Choose the storage strategy | Second position on Choose the storage strategy',
    );
  });
});
