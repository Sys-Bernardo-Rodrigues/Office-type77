import {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProviderAdapter,
  ProviderConfig,
  ProviderConnectionResult,
  SupportedProviderId,
} from '../types';

interface OpenAICompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        function: {
          name: string;
          arguments: string | Record<string, unknown>;
        };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

export abstract class BaseOpenAIAdapter implements LLMProviderAdapter {
  abstract readonly providerId: SupportedProviderId;
  abstract readonly name: string;
  abstract readonly defaultBaseUrl: string;
  abstract readonly defaultModel: string;

  protected getAuthHeaderName(): string {
    return 'Authorization';
  }

  protected formatAuthHeader(apiKey: string): string {
    return `Bearer ${apiKey}`;
  }

  protected getCustomHeaders(config?: Partial<ProviderConfig>): Record<string, string> {
    return config?.customHeaders || {};
  }

  async generateCompletion(
    request: LLMCompletionRequest,
    config?: Partial<ProviderConfig>
  ): Promise<LLMCompletionResponse> {
    const baseUrl = config?.baseUrl || this.defaultBaseUrl;
    const model = request.model || config?.defaultModel || this.defaultModel;
    const apiKey = config?.apiKey || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getCustomHeaders(config),
    };

    if (apiKey) {
      headers[this.getAuthHeaderName()] = this.formatAuthHeader(apiKey);
    }

    const messages = [...request.messages];
    if (request.systemPrompt && !messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    const payload: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    };

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: request.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status} from ${this.name}: ${errorText}`);
      }

      const data = await response.json() as OpenAICompletionResponse;
      const choice = data.choices?.[0];
      const message = choice?.message;

      const toolCalls = message?.tool_calls?.map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments) as Record<string, unknown>
          : toolCall.function.arguments,
      }));

      return {
        content: message?.content || '',
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        model: data.model || model,
        provider: this.providerId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[${this.name}] Completion failed: ${message}`);
    }
  }

  async testConnection(config?: Partial<ProviderConfig>): Promise<ProviderConnectionResult> {
    const startTime = Date.now();
    const baseUrl = config?.baseUrl || this.defaultBaseUrl;
    const model = config?.defaultModel || this.defaultModel;

    if (!baseUrl) {
      return {
        success: false,
        message: 'Endpoint Base URL is required.',
      };
    }

    try {
      const res = await this.generateCompletion(
        {
          messages: [{ role: 'user', content: 'Ping: reply with pong' }],
          maxTokens: 5,
        },
        config
      );

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        message: `Successfully connected to ${this.name}! Response: "${res.content.trim()}"`,
        latencyMs,
        testedModel: model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Connection failed: ${message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
