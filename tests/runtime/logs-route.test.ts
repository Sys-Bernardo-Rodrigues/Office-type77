/**
 * Importers/Callers: Vitest runtime suite; exercises the Task 8 GET /api/logs handler
 * Affected API: GET /api/logs
 * Data Schemas: Prisma Agent, Task, and AgentLog records
 * User Instruction: Task 8 ruling — added a logs route so AgentLogDrawer has a data source
 *   (docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md, Task 8)
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/db/prisma';
import { GET as getLogs } from '../../src/app/api/logs/route';

const agentIds: string[] = [];
const taskIds: string[] = [];

afterEach(async () => {
  await prisma.agentLog.deleteMany({ where: { agentId: { in: agentIds } } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.agent.deleteMany({ where: { id: { in: agentIds } } });
  agentIds.length = 0;
  taskIds.length = 0;
});

async function createAgent(name: string) {
  const agent = await prisma.agent.create({
    data: {
      name,
      role: 'Engineer',
      systemPrompt: 'Build carefully.',
      provider: 'openclaude',
      model: 'test-model',
      avatar: name,
    },
  });
  agentIds.push(agent.id);
  return agent;
}

describe('GET /api/logs', () => {
  it('returns logs newest first', async () => {
    const agent = await createAgent('Ada');
    const task = await prisma.task.create({ data: { title: 'Task', description: 'Do work' } });
    taskIds.push(task.id);

    const first = await prisma.agentLog.create({
      data: { agentId: agent.id, taskId: task.id, type: 'thought', content: 'first' },
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await prisma.agentLog.create({
      data: { agentId: agent.id, taskId: task.id, type: 'action', content: 'second' },
    });

    const response = await getLogs(new NextRequest('http://localhost/api/logs'));
    const data = await response.json();

    const ids = data.logs.map((log: { id: string }) => log.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    expect(data.logs[0].agent.name).toBe('Ada');
  });

  it('filters by agentId', async () => {
    const agentA = await createAgent('Ada');
    const agentB = await createAgent('Bea');
    const logA = await prisma.agentLog.create({
      data: { agentId: agentA.id, type: 'thought', content: 'from A' },
    });
    await prisma.agentLog.create({
      data: { agentId: agentB.id, type: 'thought', content: 'from B' },
    });

    const response = await getLogs(new NextRequest(`http://localhost/api/logs?agentId=${agentA.id}`));
    const data = await response.json();

    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].id).toBe(logA.id);
  });
});
