import { BaseOpenAIAdapter } from './base';
import { SupportedProviderId } from '../types';

export class OpenClaudeOmniAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'openclaude-omni';
  readonly name = 'OpenClaude Omni';
  readonly defaultBaseUrl = 'https://api.openclaude.io/v1';
  readonly defaultModel = 'openclaude-omni-v1';
}

export class OpenClaudeDirectAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'openclaude';
  readonly name = 'OpenClaude Direct';
  readonly defaultBaseUrl = 'https://api.openclaude.ai/v1';
  readonly defaultModel = 'claude-3-7-sonnet';
}
