/**
 * Importers/Callers: src/app/api/providers/test/route.ts, tests/providers/test-config.test.ts
 * Affected API: resolveProviderTestConfig(providerId, overrides, saved, adapter)
 * Data Schemas: Prisma ProviderSetting shape (apiKey, baseUrl, defaultModel, customHeaders JSON)
 * User Instruction: Task 8 final-review fix pass — moved out of route.ts because a Next.js App
 *   Router route module may only export HTTP method handlers and a small set of config values;
 *   `tsc --noEmit` failed against Next's generated `.next/types/.../route.ts` once this function
 *   was exported alongside POST.
 */
import type { SupportedProviderId } from './types';

export interface ProviderTestOverrides {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  customHeaders?: Record<string, string>;
}

export interface SavedProviderSetting {
  apiKey?: string | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  customHeaders?: string | null;
}

export interface AdapterDefaults {
  defaultBaseUrl: string;
  defaultModel: string;
}

export function resolveProviderTestConfig(
  providerId: SupportedProviderId,
  overrides: ProviderTestOverrides,
  saved: SavedProviderSetting | null,
  adapter: AdapterDefaults,
) {
  return {
    providerId,
    apiKey: overrides.apiKey || saved?.apiKey || undefined,
    baseUrl: overrides.baseUrl || saved?.baseUrl || adapter.defaultBaseUrl,
    defaultModel: overrides.defaultModel || saved?.defaultModel || adapter.defaultModel,
    customHeaders: overrides.customHeaders ?? (saved?.customHeaders ? JSON.parse(saved.customHeaders) : undefined),
  };
}
