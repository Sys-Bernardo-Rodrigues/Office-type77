import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Type77MCPServer } from '../../src/lib/mcp/server';
import { SUPPORTED_PROVIDERS } from '../../src/lib/providers/registry';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    providerSetting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Type77MCPServer', () => {
  let server: Type77MCPServer;

  beforeEach(() => {
    server = new Type77MCPServer();
  });

  it('should expose list providers tool', async () => {
    const tools = await server.listTools();
    const toolNames = tools.map(t => t.name);

    expect(toolNames).toContain('list_providers');
  });

  it('should expose get provider settings tool', async () => {
    const tools = await server.listTools();
    const toolNames = tools.map(t => t.name);

    expect(toolNames).toContain('get_provider_settings');
  });

  it('should expose test connection tool for each provider', async () => {
    const tools = await server.listTools();
    const toolNames = tools.map(t => t.name);

    for (const providerId of SUPPORTED_PROVIDERS) {
      expect(toolNames).toContain(`test_${providerId}_connection`);
    }
  });

  it('should list all supported providers', async () => {
    const providers = await server.listProviders();
    expect(providers.length).toBe(8);
    expect(providers).toContain('openclaude-omni');
    expect(providers).toContain('hermes');
    expect(providers).toContain('antigravity');
  });
});