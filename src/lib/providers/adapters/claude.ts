import {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProviderAdapter,
  ProviderConfig,
  ProviderConnectionResult,
  SupportedProviderId,
} from '../types';

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicCompletionResponse {
  content?: Array<AnthropicTextBlock | AnthropicToolUseBlock>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  model?: string;
}

export class ClaudeDirectAdapter implements LLMProviderAdapter {
  readonly providerId: SupportedProviderId = 'claude';
  readonly name = 'Anthropic Claude Official';
  readonly defaultBaseUrl = 'https://api.anthropic.com/v1';
  readonly defaultModel = 'claude-3-7-sonnet-20250219';

  async generateCompletion(
    request: LLMCompletionRequest,
    config?: Partial<ProviderConfig>
  ): Promise<LLMCompletionResponse> {
    const baseUrl = config?.baseUrl || this.defaultBaseUrl;
    const model = request.model || config?.defaultModel || this.defaultModel;
    const apiKey = config?.apiKey || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      ...(config?.customHeaders || {}),
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      }));

    const systemPrompt =
      request.systemPrompt ||
      request.messages.find((m) => m.role === 'system')?.content ||
      undefined;

    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}messages` : `${baseUrl}/messages`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: request.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status} from Anthropic: ${errorText}`);
      }

      const data = await response.json() as AnthropicCompletionResponse;
      const textBlocks = data.content?.filter(
        (block): block is AnthropicTextBlock => block.type === 'text'
      );
      const toolUseBlocks = data.content?.filter(
        (block): block is AnthropicToolUseBlock => block.type === 'tool_use'
      );

      const content = textBlocks?.map((block) => block.text).join('\n') || '';
      const toolCalls = toolUseBlocks?.map((block) => ({
        id: block.id,
        name: block.name,
        arguments: block.input,
      }));

      return {
        content,
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens || 0,
          completionTokens: data.usage.output_tokens || 0,
          totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
        } : undefined,
        model: data.model || model,
        provider: this.providerId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[Claude Direct] Completion failed: ${message}`);
    }
  }

  async testConnection(config?: Partial<ProviderConfig>): Promise<ProviderConnectionResult> {
    const startTime = Date.now();
    const baseUrl = config?.baseUrl || this.defaultBaseUrl;
    const model = config?.defaultModel || this.defaultModel;

    if (!baseUrl) {
      return {
        success: false,
        message: 'Anthropic Base URL is required.',
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
        message: `Successfully connected to Anthropic Claude! Response: "${res.content.trim()}"`,
        latencyMs,
        testedModel: model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Anthropic connection failed: ${message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
