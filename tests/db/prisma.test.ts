import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/db/prisma';

describe('Prisma Schema & SQLite Persistence', () => {
  it('can query provider settings and agents', async () => {
    const providers = await prisma.providerSetting.findMany();
    expect(Array.isArray(providers)).toBe(true);
  });

  it('can create and query an agent with designated role', async () => {
    const agent = await prisma.agent.create({
      data: {
        name: 'Dev Pixel',
        role: 'Full-Stack Developer',
        systemPrompt: 'You are a pixel developer.',
        model: 'openclaude-sonnet-3.7',
        provider: 'openclaude',
        avatar: 'dev_1',
        deskId: 'desk-01',
      },
    });

    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('Dev Pixel');
    expect(agent.provider).toBe('openclaude');

    // Clean up
    await prisma.agent.delete({ where: { id: agent.id } });
  });

  it('can create and query office layout with furniture items', async () => {
    const layout = await prisma.officeLayout.create({
      data: {
        name: 'Main HQ',
        width: 32,
        height: 24,
        furniture: {
          create: [
            {
              furnitureId: 'desk-01',
              itemType: 'desk',
              gridX: 5,
              gridY: 5,
              width: 2,
              height: 1,
              rotation: 0,
            },
          ],
        },
      },
      include: { furniture: true },
    });

    expect(layout.id).toBeDefined();
    expect(layout.furniture.length).toBe(1);
    expect(layout.furniture[0].itemType).toBe('desk');

    // Clean up
    await prisma.furnitureItem.deleteMany({ where: { layoutId: layout.id } });
    await prisma.officeLayout.delete({ where: { id: layout.id } });
  });
});
