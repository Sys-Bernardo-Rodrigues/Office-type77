/**
 * Type77 MCP Server - Exposes Provider Hub as MCP tools for external AI systems
 *
 * Importers/Callers: External AI systems via MCP protocol
 * Affected API: Type77MCPServer class with listTools(), callTool(), listProviders()
 * Data Schemas: MCPTool, MCPToolResult interfaces
 * User Instruction: "crie um mcp que vai ser sempre mantido atualizado para podermos usar em outra ia se necessario"
 */

import { SUPPORTED_PROVIDERS, getProviderAdapter } from '../providers/registry';
import { prisma } from '@/lib/db/prisma';
import type { SupportedProviderId } from '../providers/types';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export class Type77MCPServer {
  /**
   * List all available MCP tools
   */
  async listTools(): Promise<MCPTool[]> {
    const tools: MCPTool[] = [
      {
        name: 'list_providers',
        description: 'List all supported LLM providers in Type77',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_provider_settings',
        description: 'Get current configuration for all providers (API keys masked)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_provider',
        description: 'Update provider configuration (API key, base URL, model)',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              description: 'Provider ID',
              enum: SUPPORTED_PROVIDERS,
            },
            apiKey: {
              type: 'string',
              description: 'API key for authentication',
            },
            baseUrl: {
              type: 'string',
              description: 'Base URL for API requests',
            },
            defaultModel: {
              type: 'string',
              description: 'Default model to use',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether provider is active',
            },
          },
          required: ['providerId'],
        },
      },
    ];

    // Add per-provider test connection tools
    for (const providerId of SUPPORTED_PROVIDERS) {
      const adapter = getProviderAdapter(providerId);
      tools.push({
        name: `test_${providerId}_connection`,
        description: `Test connection to ${adapter.name}`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      });
    }

    return tools;
  }

  /**
   * Execute a tool call
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'list_providers':
          return await this.handleListProviders();
        case 'get_provider_settings':
          return await this.handleGetProviderSettings();
        case 'update_provider':
          return await this.handleUpdateProvider(args);
        default:
          if (name.startsWith('test_') && name.endsWith('_connection')) {
            const providerId = name.replace('test_', '').replace('_connection', '') as SupportedProviderId;
            return await this.handleTestConnection(providerId);
          }
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  /**
   * List all supported providers
   */
  async listProviders(): Promise<SupportedProviderId[]> {
    return [...SUPPORTED_PROVIDERS];
  }

  // Tool handlers

  private async handleListProviders(): Promise<MCPToolResult> {
    const providers = SUPPORTED_PROVIDERS.map(id => {
      const adapter = getProviderAdapter(id);
      return {
        id,
        name: adapter.name,
        defaultBaseUrl: adapter.defaultBaseUrl,
        defaultModel: adapter.defaultModel,
      };
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(providers, null, 2) }],
    };
  }

  private async handleGetProviderSettings(): Promise<MCPToolResult> {
    const settings = await prisma.providerSetting.findMany({
      orderBy: { providerId: 'asc' },
    });

    const result = SUPPORTED_PROVIDERS.map(id => {
      const adapter = getProviderAdapter(id);
      const saved = settings.find(s => s.providerId === id);
      return {
        providerId: id,
        name: adapter.name,
        baseUrl: saved?.baseUrl || adapter.defaultBaseUrl,
        model: saved?.defaultModel || adapter.defaultModel,
        isActive: saved?.isActive ?? false,
        hasApiKey: !!saved?.apiKey,
        apiKeyPreview: saved?.apiKey ? '••••' + saved.apiKey.slice(-4) : null,
      };
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  private async handleUpdateProvider(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { providerId, apiKey, baseUrl, defaultModel, isActive } = args;

    if (!providerId || !SUPPORTED_PROVIDERS.includes(providerId as SupportedProviderId)) {
      return {
        content: [{ type: 'text', text: `Invalid provider: ${providerId}` }],
        isError: true,
      };
    }

    const adapter = getProviderAdapter(providerId as SupportedProviderId);

    const updated = await prisma.providerSetting.upsert({
      where: { providerId: providerId as string },
      update: {
        apiKey: apiKey as string | undefined,
        baseUrl: baseUrl as string | undefined,
        defaultModel: defaultModel as string | undefined,
        isActive: isActive as boolean | undefined,
      },
      create: {
        providerId: providerId as string,
        name: adapter.name,
        apiKey: apiKey as string | null,
        baseUrl: baseUrl as string || adapter.defaultBaseUrl,
        defaultModel: defaultModel as string || adapter.defaultModel,
        isActive: isActive as boolean ?? true,
      },
    });

    return {
      content: [{ type: 'text', text: JSON.stringify({
        providerId: updated.providerId,
        name: updated.name,
        isActive: updated.isActive,
        baseUrl: updated.baseUrl,
        model: updated.defaultModel,
      }, null, 2) }],
    };
  }

  private async handleTestConnection(providerId: SupportedProviderId): Promise<MCPToolResult> {
    const saved = await prisma.providerSetting.findUnique({
      where: { providerId },
    });

    const adapter = getProviderAdapter(providerId);

    const config = {
      providerId,
      apiKey: saved?.apiKey || undefined,
      baseUrl: saved?.baseUrl || adapter.defaultBaseUrl,
      defaultModel: saved?.defaultModel || adapter.defaultModel,
    };

    const result = await adapter.testConnection(config);

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
}
