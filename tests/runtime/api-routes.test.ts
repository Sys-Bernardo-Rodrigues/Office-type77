/**
 * Importers/Callers: Vitest runtime suite; exercises Task 5 Next.js API handlers
 * Affected API: agent, task, task-execution, and meeting route handlers
 * Data Schemas: Prisma Agent, Task, Meeting, MeetingMember, and AgentLog records
 * User Instruction: "continue"
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/db/prisma';
import { GET as getAgents, POST as createAgent } from '../../src/app/api/agents/route';
import { GET as getTasks, POST as createTask } from '../../src/app/api/tasks/route';
import { POST as executeTaskRoute } from '../../src/app/api/tasks/execute/route';
import { GET as getMeetings, POST as createMeeting } from '../../src/app/api/meetings/route';

const agentIds: string[] = [];
const taskIds: string[] = [];
const meetingIds: string[] = [];

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await prisma.agentLog.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.meetingMember.deleteMany({ where: { meetingId: { in: meetingIds } } });
  await prisma.meeting.deleteMany({ where: { id: { in: meetingIds } } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.agent.deleteMany({ where: { id: { in: agentIds } } });
  agentIds.length = 0;
  taskIds.length = 0;
  meetingIds.length = 0;
});

describe('Task 5 API routes', () => {
  it('creates and lists agents', async () => {
    const response = await createAgent(jsonRequest('http://localhost/api/agents', {
      name: 'Ada',
      role: 'Engineer',
      systemPrompt: 'Build carefully.',
      provider: 'openclaude',
      model: 'test-model',
      avatar: 'ada',
    }));
    const created = await response.json();
    agentIds.push(created.agent.id);

    expect(response.status).toBe(201);
    expect(created.agent.name).toBe('Ada');

    const list = await (await getAgents()).json();
    expect(list.agents.some((agent: { id: string }) => agent.id === created.agent.id)).toBe(true);
  });

  it('rejects malformed agent payloads', async () => {
    const response = await createAgent(jsonRequest('http://localhost/api/agents', { name: 'Ada' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing required agent fields' });
  });

  it('creates and lists tasks with parent relationships', async () => {
    const parent = await prisma.task.create({ data: { title: 'Parent', description: 'Coordinate work' } });
    taskIds.push(parent.id);

    const response = await createTask(jsonRequest('http://localhost/api/tasks', {
      title: 'Child',
      description: 'Do focused work',
      parentId: parent.id,
      priority: 'high',
    }));
    const created = await response.json();
    taskIds.push(created.task.id);

    expect(response.status).toBe(201);
    expect(created.task.parentId).toBe(parent.id);

    const list = await (await getTasks()).json();
    expect(list.tasks.some((task: { id: string }) => task.id === created.task.id)).toBe(true);
  });

  it('validates task execution input before starting the runtime', async () => {
    const response = await executeTaskRoute(jsonRequest('http://localhost/api/tasks/execute', {
      taskId: 'task-id',
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'taskId and workspacePath are required' });
  });

  it('creates and lists meetings through the meeting protocol', async () => {
    const agent = await prisma.agent.create({
      data: {
        name: 'Reviewer',
        role: 'Reviewer',
        systemPrompt: 'Review.',
        provider: 'openclaude',
        model: 'test-model',
        avatar: 'reviewer',
      },
    });
    agentIds.push(agent.id);

    const response = await createMeeting(jsonRequest('http://localhost/api/meetings', {
      title: 'Review',
      topic: 'Architecture',
      participantIds: [agent.id],
    }));
    const created = await response.json();
    meetingIds.push(created.meeting.id);

    expect(response.status).toBe(201);
    expect(created.meeting.members).toHaveLength(1);

    const list = await (await getMeetings()).json();
    expect(list.meetings.some((meeting: { id: string }) => meeting.id === created.meeting.id)).toBe(true);
  });

  it('returns a structured error for unknown meeting participants', async () => {
    const response = await createMeeting(jsonRequest('http://localhost/api/meetings', {
      title: 'Review',
      topic: 'Architecture',
      participantIds: ['missing-agent'],
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Unknown meeting participants: missing-agent' });
  });
});
