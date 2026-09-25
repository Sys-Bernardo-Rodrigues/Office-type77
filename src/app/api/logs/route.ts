/**
 * Importers/Callers: src/store/useOfficeStore.ts (fetchLogs), src/components/logs/AgentLogDrawer.tsx, Vitest route suite
 * Affected API: GET /api/logs
 * Data Schemas: Prisma AgentLog records (with agent and task relations)
 * User Instruction: Task 8 ruling — added so the AgentLogDrawer "live log terminal" has a data
 *   source; no prior route exposed AgentLog rows (see docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md, Task 8)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') ?? undefined;
  const taskId = request.nextUrl.searchParams.get('taskId') ?? undefined;
  const limitParam = request.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const logs = await prisma.agentLog.findMany({
    where: {
      ...(agentId ? { agentId } : {}),
      ...(taskId ? { taskId } : {}),
    },
    include: { agent: true, task: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs });
}
