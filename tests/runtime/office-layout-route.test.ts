/**
 * Importers/Callers: Vitest runtime suite; exercises Task 7 office layout persistence API
 * Affected API: GET/POST /api/office/layout
 * Data Schemas: Prisma OfficeLayout + FurnitureItem records
 * User Instruction: "vamos continuar o projeto paramos na task 7 da uma analisada e vamos continuar"
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/db/prisma';
import { GET as getLayout, POST as saveLayout } from '../../src/app/api/office/layout/route';

const layoutNames = new Set<string>();

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await prisma.officeLayout.deleteMany({ where: { name: { in: Array.from(layoutNames) } } });
  layoutNames.clear();
});

describe('Task 7 office layout API', () => {
  it('returns an empty default layout when none has been saved', async () => {
    const response = await getLayout(new NextRequest('http://localhost/api/office/layout?name=never-saved'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.layout).toEqual({ name: 'never-saved', width: 32, height: 24, furniture: [] });
  });

  it('saves a blueprint with furniture and reloads it', async () => {
    const name = `test-layout-${Date.now()}`;
    layoutNames.add(name);

    const saveResponse = await saveLayout(jsonRequest('http://localhost/api/office/layout', {
      name,
      width: 20,
      height: 14,
      furniture: [
        { furnitureId: 'p_1', itemType: 'desk', gridX: 3, gridY: 4, width: 2, height: 1, rotation: 0 },
        { furnitureId: 'p_2', itemType: 'chair', gridX: 5, gridY: 4 },
      ],
    }));
    const saveBody = await saveResponse.json();

    expect(saveResponse.status).toBe(201);
    expect(saveBody.layout.furniture).toHaveLength(2);

    const loadResponse = await getLayout(new NextRequest(`http://localhost/api/office/layout?name=${name}`));
    const loadBody = await loadResponse.json();

    expect(loadBody.layout.furniture).toHaveLength(2);
    expect(loadBody.layout.width).toBe(20);
  });

  it('replaces furniture on re-save rather than accumulating duplicates', async () => {
    const name = `test-layout-replace-${Date.now()}`;
    layoutNames.add(name);

    await saveLayout(jsonRequest('http://localhost/api/office/layout', {
      name,
      furniture: [{ furnitureId: 'p_1', itemType: 'desk', gridX: 1, gridY: 1 }],
    }));
    const secondSave = await saveLayout(jsonRequest('http://localhost/api/office/layout', {
      name,
      furniture: [{ furnitureId: 'p_2', itemType: 'sofa', gridX: 2, gridY: 2 }],
    }));
    const secondBody = await secondSave.json();

    expect(secondBody.layout.furniture).toHaveLength(1);
    expect(secondBody.layout.furniture[0].furnitureId).toBe('p_2');
  });

  it('rejects invalid furniture payloads', async () => {
    const response = await saveLayout(jsonRequest('http://localhost/api/office/layout', {
      name: 'invalid-test',
      furniture: [{ furnitureId: '', itemType: 'desk', gridX: 1, gridY: 1 }],
    }));

    expect(response.status).toBe(400);
  });

  it('rejects non-positive dimensions', async () => {
    const response = await saveLayout(jsonRequest('http://localhost/api/office/layout', {
      name: 'invalid-dims',
      width: 0,
      height: 10,
      furniture: [],
    }));

    expect(response.status).toBe(400);
  });
});
