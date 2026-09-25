import { BaseOpenAIAdapter } from './base';
import { SupportedProviderId } from '../types';

export class CodexAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'codex';
  readonly name = 'Codex / OpenAI Direct';
  readonly defaultBaseUrl = 'https://api.openai.com/v1';
  readonly defaultModel = 'gpt-4o';
}
