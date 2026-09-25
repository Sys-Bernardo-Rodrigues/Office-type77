import { BaseOpenAIAdapter } from './base';
import { SupportedProviderId } from '../types';

export class HermesAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'hermes';
  readonly name = 'Hermes Agent Engine';
  readonly defaultBaseUrl = 'https://api.hermes-ai.org/v1';
  readonly defaultModel = 'hermes-3-llama-3.1-70b';
}
