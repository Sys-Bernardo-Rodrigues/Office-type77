export type SupportedProviderId =
  | 'openclaude-omni'
  | 'openclaude'
  | 'hermes'
  | 'openroute'
  | 'codex'
  | 'claude'
  | 'antigravity'
  | 'custom';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  signal?: AbortSignal;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface LLMCompletionResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface ProviderConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  testedModel?: string;
}

export interface ProviderConfig {
  providerId: SupportedProviderId;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  customHeaders?: Record<string, string>;
  isActive?: boolean;
}

export interface LLMProviderAdapter {
  readonly providerId: SupportedProviderId;
  readonly name: string;
  readonly defaultBaseUrl: string;
  readonly defaultModel: string;

  generateCompletion(
    request: LLMCompletionRequest,
    config?: Partial<ProviderConfig>
  ): Promise<LLMCompletionResponse>;

  testConnection(
    config?: Partial<ProviderConfig>
  ): Promise<ProviderConnectionResult>;
}
