/**
 * Importers/Callers: Vitest suite; exercises resolveProviderTestConfig used by
 *   POST /api/providers/test
 * Affected API: resolveProviderTestConfig(providerId, overrides, saved, adapter)
 * Data Schemas: Prisma ProviderSetting shape (apiKey, baseUrl, defaultModel, customHeaders JSON)
 * User Instruction: Task 8 final-review fix pass — code review found "Testar conexão" always
 *   tested the DB-saved provider settings, never the apiKey/baseUrl/model the user had just
 *   typed into ProviderSettingsModal but not yet saved.
 */
import { describe, expect, it } from 'vitest';
import { resolveProviderTestConfig } from '../../src/lib/providers/resolveTestConfig';

const adapter = { defaultBaseUrl: 'https://default.example/v1', defaultModel: 'default-model' };

describe('resolveProviderTestConfig', () => {
  it('prefers an override apiKey/baseUrl/model over the saved settings', () => {
    const saved = {
      apiKey: 'saved-key',
      baseUrl: 'https://saved.example/v1',
      defaultModel: 'saved-model',
      customHeaders: null,
    };

    const config = resolveProviderTestConfig(
      'custom',
      { apiKey: 'draft-key', baseUrl: 'https://draft.example/v1', defaultModel: 'draft-model' },
      saved,
      adapter,
    );

    expect(config).toMatchObject({
      providerId: 'custom',
      apiKey: 'draft-key',
      baseUrl: 'https://draft.example/v1',
      defaultModel: 'draft-model',
    });
  });

  it('falls back to saved settings when no override is given', () => {
    const saved = {
      apiKey: 'saved-key',
      baseUrl: 'https://saved.example/v1',
      defaultModel: 'saved-model',
      customHeaders: null,
    };

    const config = resolveProviderTestConfig('custom', {}, saved, adapter);

    expect(config).toMatchObject({
      apiKey: 'saved-key',
      baseUrl: 'https://saved.example/v1',
      defaultModel: 'saved-model',
    });
  });

  it('falls back to the adapter defaults when nothing is saved or overridden', () => {
    const config = resolveProviderTestConfig('custom', {}, null, adapter);

    expect(config).toMatchObject({
      apiKey: undefined,
      baseUrl: adapter.defaultBaseUrl,
      defaultModel: adapter.defaultModel,
    });
  });
});
