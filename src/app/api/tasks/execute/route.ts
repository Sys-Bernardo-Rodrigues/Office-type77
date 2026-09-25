/**
 * Importers/Callers: Kanban controls, external runtime clients, and Vitest route suite
 * Affected API: POST /api/tasks/execute
 * Data Schemas: Prisma Task, Agent, and AgentLog lifecycle records
 * User Instruction: "continue"
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeTask } from '@/lib/runtime/task-manager';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { taskId, workspacePath, maxIterations, timeout } = body;

  if (typeof taskId !== 'string' || !taskId || typeof workspacePath !== 'string' || !workspacePath) {
    return NextResponse.json({ error: 'taskId and workspacePath are required' }, { status: 400 });
  }

  try {
    const result = await executeTask(taskId, { workspacePath, maxIterations, timeout });
    return NextResponse.json({ result }, { status: result.success ? 200 : 422 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
