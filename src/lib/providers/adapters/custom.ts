import { BaseOpenAIAdapter } from './base';
import { SupportedProviderId } from '../types';

export class CustomProviderAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'custom';
  readonly name = 'Custom OpenAI-Compatible Endpoint';
  readonly defaultBaseUrl = '';
  readonly defaultModel = 'default';
}
