/**
 * Importers/Callers: Kanban UI, external clients, and Vitest route suite
 * Affected API: GET/POST /api/tasks
 * Data Schemas: Prisma Task hierarchy and Agent assignment
 * User Instruction: "continue"
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSubtask } from '@/lib/runtime/task-manager';

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: { assignedTo: true, subTasks: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, assignedToId, parentId, priority } = body;

  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
  }

  try {
    const input = { title, description, assignedToId, priority };
    const task = parentId
      ? await createSubtask(parentId, input)
      : await prisma.task.create({ data: input });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
