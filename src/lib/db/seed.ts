import { prisma } from './prisma';

export const DEFAULT_PROVIDERS = [
  {
    providerId: 'openclaude-omni',
    name: 'OpenClaude Omni',
    baseUrl: 'https://api.openclaude.io/v1',
    defaultModel: 'openclaude-omni-v1',
    isActive: true,
  },
  {
    providerId: 'openclaude',
    name: 'OpenClaude Direct',
    baseUrl: 'https://api.openclaude.ai/v1',
    defaultModel: 'claude-3-7-sonnet',
    isActive: true,
  },
  {
    providerId: 'hermes',
    name: 'Hermes Agent Engine',
    baseUrl: 'https://api.hermes-ai.org/v1',
    defaultModel: 'hermes-3-llama-3.1-70b',
    isActive: true,
  },
  {
    providerId: 'openroute',
    name: 'OpenRouter / OpenRoute',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    isActive: true,
  },
  {
    providerId: 'codex',
    name: 'Codex / OpenAI Direct',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    isActive: true,
  },
  {
    providerId: 'claude',
    name: 'Anthropic Claude Official',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    isActive: true,
  },
  {
    providerId: 'antigravity',
    name: 'Antigravity (DeepMind Engine)',
    baseUrl: 'https://api.antigravity.deepmind.internal/v1',
    defaultModel: 'antigravity-deepmind-preview',
    isActive: true,
  },
  {
    providerId: 'custom',
    name: 'Custom OpenAI-Compatible Endpoint',
    baseUrl: '',
    defaultModel: 'default',
    isActive: false,
  },
];

export async function seedDatabase() {
  for (const provider of DEFAULT_PROVIDERS) {
    await prisma.providerSetting.upsert({
      where: { providerId: provider.providerId },
      update: {
        name: provider.name,
        baseUrl: provider.baseUrl,
        defaultModel: provider.defaultModel,
      },
      create: {
        providerId: provider.providerId,
        name: provider.name,
        baseUrl: provider.baseUrl,
        defaultModel: provider.defaultModel,
        isActive: provider.isActive,
      },
    });
  }

  // Ensure default office layout exists
  const existingLayout = await prisma.officeLayout.findFirst({
    where: { name: 'Main HQ' },
  });

  if (!existingLayout) {
    await prisma.officeLayout.create({
      data: {
        name: 'Main HQ',
        width: 32,
        height: 24,
        furniture: {
          create: [
            {
              furnitureId: 'desk-01',
              itemType: 'desk',
              gridX: 6,
              gridY: 6,
              width: 2,
              height: 1,
              rotation: 0,
            },
            {
              furnitureId: 'desk-02',
              itemType: 'desk',
              gridX: 10,
              gridY: 6,
              width: 2,
              height: 1,
              rotation: 0,
            },
            {
              furnitureId: 'coffee-01',
              itemType: 'coffee_machine',
              gridX: 20,
              gridY: 4,
              width: 1,
              height: 1,
              rotation: 0,
              interactionType: 'coffee',
            },
            {
              furnitureId: 'conf-table-01',
              itemType: 'conference_table',
              gridX: 14,
              gridY: 14,
              width: 4,
              height: 2,
              rotation: 0,
              interactionType: 'meeting',
            },
          ],
        },
      },
    });
  }
}
