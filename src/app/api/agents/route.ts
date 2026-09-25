/**
 * Importers/Callers: office HUD, external clients, and Vitest route suite
 * Affected API: GET/POST /api/agents
 * Data Schemas: Prisma Agent records
 * User Instruction: "continue"
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SUPPORTED_PROVIDERS } from '@/lib/providers/registry';
import type { SupportedProviderId } from '@/lib/providers/types';

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, role, systemPrompt, provider, model, avatar, temperature } = body;

  if (![name, role, systemPrompt, provider, model, avatar].every((value) => typeof value === 'string' && value.trim())) {
    return NextResponse.json({ error: 'Missing required agent fields' }, { status: 400 });
  }
  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProviderId)) {
    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  }
  if (temperature !== undefined && (typeof temperature !== 'number' || !Number.isFinite(temperature))) {
    return NextResponse.json({ error: 'temperature must be a finite number' }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: { name, role, systemPrompt, provider, model, avatar, temperature },
  });
  return NextResponse.json({ agent }, { status: 201 });
}
