import { LLMProviderAdapter, SupportedProviderId } from './types';
import { OpenClaudeOmniAdapter, OpenClaudeDirectAdapter } from './adapters/openclaude';
import { HermesAdapter } from './adapters/hermes';
import { OpenRouteAdapter } from './adapters/openroute';
import { CodexAdapter } from './adapters/codex';
import { ClaudeDirectAdapter } from './adapters/claude';
import { AntigravityAdapter } from './adapters/antigravity';
import { CustomProviderAdapter } from './adapters/custom';

export const SUPPORTED_PROVIDERS: SupportedProviderId[] = [
  'openclaude-omni',
  'openclaude',
  'hermes',
  'openroute',
  'codex',
  'claude',
  'antigravity',
  'custom',
];

const ADAPTER_MAP: Record<SupportedProviderId, LLMProviderAdapter> = {
  'openclaude-omni': new OpenClaudeOmniAdapter(),
  'openclaude': new OpenClaudeDirectAdapter(),
  'hermes': new HermesAdapter(),
  'openroute': new OpenRouteAdapter(),
  'codex': new CodexAdapter(),
  'claude': new ClaudeDirectAdapter(),
  'antigravity': new AntigravityAdapter(),
  'custom': new CustomProviderAdapter(),
};

export function getProviderAdapter(providerId: SupportedProviderId): LLMProviderAdapter {
  const adapter = ADAPTER_MAP[providerId];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }
  return adapter;
}

export function listSupportedProviders(): SupportedProviderId[] {
  return [...SUPPORTED_PROVIDERS];
}

export function getAllAdapters(): LLMProviderAdapter[] {
  return SUPPORTED_PROVIDERS.map((id) => ADAPTER_MAP[id]);
}
