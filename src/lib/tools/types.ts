/**
 * Sandboxed Tools Engine - Type Definitions
 *
 * Importers/Callers: ReAct agent runtime (Task 5), tool registry
 * Affected API: ToolDefinition, ToolResult, ToolContext interfaces
 * Data Schemas: Tool parameter schemas, execution results
 * User Instruction: "Implement workspace path sandboxing, safe bash execution timeouts, web fetching, and multi-agent delegation tools"
 */

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export interface ToolContext {
  workspacePath: string;
  agentId: string;
  timeout?: number;
  env?: Record<string, string>;
  signal?: AbortSignal;
}
