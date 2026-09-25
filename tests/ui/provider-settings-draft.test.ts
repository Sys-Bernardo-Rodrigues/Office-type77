/**
 * Importers/Callers: Vitest UI suite; exercises ProviderSettingsModal's draftFrom
 * Affected API: draftFrom(provider) — the checkbox-state initializer for the Ativo toggle
 * Data Schemas: ProviderSummary (src/store/useOfficeStore.ts)
 * User Instruction: Task 8 final-review fix pass — code review found that a provider with
 *   no saved ProviderSetting row (apiKey: null) always starts as isActive: false, so clicking
 *   Salvar persists isActive: false, overriding the route's own create default of true, and
 *   the provider can never run a task even after the user enters a key and saves.
 */
import { describe, expect, it } from 'vitest';
import { draftFrom } from '../../src/components/modals/ProviderSettingsModal';
import type { ProviderSummary } from '../../src/store/useOfficeStore';

function provider(overrides: Partial<ProviderSummary>): ProviderSummary {
  return {
    providerId: 'custom',
    name: 'Custom',
    defaultBaseUrl: 'https://default.example/v1',
    defaultModel: 'default-model',
    apiKey: null,
    baseUrl: 'https://default.example/v1',
    model: 'default-model',
    isActive: false,
    customHeaders: null,
    ...overrides,
  };
}

describe('ProviderSettingsModal draftFrom', () => {
  it('defaults isActive to true for a provider that has never been saved', () => {
    const draft = draftFrom(provider({ apiKey: null, isActive: false }));
    expect(draft.isActive).toBe(true);
  });

  it('respects the saved isActive value once a provider has a stored key', () => {
    const draft = draftFrom(provider({ apiKey: '****key', isActive: false }));
    expect(draft.isActive).toBe(false);
  });
});
