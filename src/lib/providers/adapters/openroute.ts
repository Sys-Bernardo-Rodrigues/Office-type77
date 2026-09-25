import { BaseOpenAIAdapter } from './base';
import { ProviderConfig, SupportedProviderId } from '../types';

export class OpenRouteAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'openroute';
  readonly name = 'OpenRouter / OpenRoute';
  readonly defaultBaseUrl = 'https://openrouter.ai/api/v1';
  readonly defaultModel = 'anthropic/claude-3.7-sonnet';

  protected getCustomHeaders(config?: Partial<ProviderConfig>): Record<string, string> {
    return {
      'HTTP-Referer': 'https://github.com/Sys-Bernardo-Rodrigues/Office-type77',
      'X-Title': 'Type77 Multi-Agent Pixel Office',
      ...(config?.customHeaders || {}),
    };
  }
}
