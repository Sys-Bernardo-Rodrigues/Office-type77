import { describe, it, expect } from 'vitest';
import {
  getProviderAdapter,
  listSupportedProviders,
  SUPPORTED_PROVIDERS,
} from '../../src/lib/providers/registry';

describe('Multi-Provider Hub Registry', () => {
  it('registers all 8 required curated provider engines and excludes ollama/groq', () => {
    const list = listSupportedProviders();
    expect(list).toContain('openclaude-omni');
    expect(list).toContain('openclaude');
    expect(list).toContain('hermes');
    expect(list).toContain('openroute');
    expect(list).toContain('codex');
    expect(list).toContain('claude');
    expect(list).toContain('antigravity');
    expect(list).toContain('custom');

    expect(list).not.toContain('ollama');
    expect(list).not.toContain('groq');
    expect(list.length).toBe(8);
  });

  it('provides configured adapters that adhere to LLMProviderAdapter contract', () => {
    for (const providerId of SUPPORTED_PROVIDERS) {
      const adapter = getProviderAdapter(providerId);
      expect(adapter).toBeDefined();
      expect(adapter.providerId).toBe(providerId);
      expect(typeof adapter.generateCompletion).toBe('function');
      expect(typeof adapter.testConnection).toBe('function');
    }
  });

  it('throws helpful error for unknown provider engines', () => {
    expect(() => getProviderAdapter('unknown-engine' as any)).toThrow(
      /Unsupported provider/i
    );
  });
});
