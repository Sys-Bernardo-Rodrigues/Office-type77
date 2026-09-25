/**
 * Importers/Callers: src/components/game/TycoonCatalogModal.tsx (save/load blueprint), Vitest route suite
 * Affected API: GET/POST /api/office/layout
 * Data Schemas: Prisma OfficeLayout + FurnitureItem records
 * User Instruction: "vamos continuar o projeto paramos na task 7 da uma analisada e vamos continuar"
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_LAYOUT_NAME = 'Default Office';
const DEFAULT_WIDTH = 32;
const DEFAULT_HEIGHT = 24;

interface FurniturePayload {
  furnitureId: string;
  itemType: string;
  gridX: number;
  gridY: number;
  width?: number;
  height?: number;
  rotation?: number;
  assignedAgentId?: string | null;
  interactionType?: string | null;
}

function isValidFurniture(value: unknown): value is FurniturePayload {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.furnitureId === 'string' && item.furnitureId.trim().length > 0
    && typeof item.itemType === 'string' && item.itemType.trim().length > 0
    && Number.isInteger(item.gridX)
    && Number.isInteger(item.gridY)
  );
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') ?? DEFAULT_LAYOUT_NAME;

  const layout = await prisma.officeLayout.findFirst({
    where: { name },
    include: { furniture: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!layout) {
    return NextResponse.json({
      layout: { name, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, furniture: [] },
    });
  }

  return NextResponse.json({ layout });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name = DEFAULT_LAYOUT_NAME,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    furniture = [],
  } = body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return NextResponse.json({ error: 'width and height must be positive integers' }, { status: 400 });
  }
  if (!Array.isArray(furniture) || !furniture.every(isValidFurniture)) {
    return NextResponse.json({ error: 'furniture must be a list of valid placements' }, { status: 400 });
  }

  const existing = await prisma.officeLayout.findFirst({ where: { name } });

  const layout = await prisma.$transaction(async (tx) => {
    const savedLayout = existing
      ? await tx.officeLayout.update({ where: { id: existing.id }, data: { width, height } })
      : await tx.officeLayout.create({ data: { name, width, height } });

    await tx.furnitureItem.deleteMany({ where: { layoutId: savedLayout.id } });

    if (furniture.length > 0) {
      await tx.furnitureItem.createMany({
        data: (furniture as FurniturePayload[]).map((item) => ({
          layoutId: savedLayout.id,
          furnitureId: item.furnitureId,
          itemType: item.itemType,
          gridX: item.gridX,
          gridY: item.gridY,
          width: item.width ?? 1,
          height: item.height ?? 1,
          rotation: item.rotation ?? 0,
          assignedAgentId: item.assignedAgentId ?? null,
          interactionType: item.interactionType ?? null,
        })),
      });
    }

    return tx.officeLayout.findUniqueOrThrow({
      where: { id: savedLayout.id },
      include: { furniture: true },
    });
  });

  return NextResponse.json({ layout }, { status: 201 });
}
