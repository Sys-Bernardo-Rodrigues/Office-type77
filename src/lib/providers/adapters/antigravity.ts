import { BaseOpenAIAdapter } from './base';
import { SupportedProviderId } from '../types';

export class AntigravityAdapter extends BaseOpenAIAdapter {
  readonly providerId: SupportedProviderId = 'antigravity';
  readonly name = 'Antigravity (DeepMind Engine)';
  readonly defaultBaseUrl = 'https://api.antigravity.deepmind.internal/v1';
  readonly defaultModel = 'antigravity-deepmind-preview';
}
