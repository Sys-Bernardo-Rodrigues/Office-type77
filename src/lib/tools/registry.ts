/**
 * Tool Registry - Central hub for all sandboxed tools
 *
 * Importers/Callers: ReAct agent runtime (Task 5), API routes, tool execution engine
 * Affected API: listAvailableTools(), executeTool(name, params, context), getToolByName(name)
 * Data Schemas: ToolDefinition array, tool routing and dispatch logic
 * User Instruction: "Implement workspace path sandboxing, safe bash execution timeouts, web fetching, and multi-agent delegation tools"
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';
import { readFileTool, writeFileTool, listDirectoryTool } from './filesystem';
import { executeBashTool } from './terminal';
import { webFetchTool } from './web';
import { delegateTaskTool, callMeetingTool } from './collaboration';

/**
 * All available tools registry
 */
const TOOLS: ToolDefinition[] = [
  // Filesystem tools
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  // Terminal tools
  executeBashTool,
  // Web tools
  webFetchTool,
  // Collaboration tools
  delegateTaskTool,
  callMeetingTool,
];

/**
 * List all available tools
 */
export async function listAvailableTools(): Promise<ToolDefinition[]> {
  return TOOLS;
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOLS.find(tool => tool.name === name);
}

/**
 * Execute a tool by name with given parameters
 */
export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const tool = getToolByName(name);

  if (!tool) {
    return {
      success: false,
      error: `Tool not found: ${name}`,
    };
  }

  const validation = validateToolParams(name, params);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('; '),
    };
  }

  if (context.signal?.aborted) {
    return {
      success: false,
      error: 'Tool execution aborted',
    };
  }

  try {
    return await tool.execute(params, context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParams(
  toolName: string,
  params: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const tool = getToolByName(toolName);
  if (!tool) {
    return { valid: false, errors: [`Tool not found: ${toolName}`] };
  }

  const errors: string[] = [];

  // Check required parameters
  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (paramDef.required && !(paramName in params)) {
      errors.push(`Missing required parameter: ${paramName}`);
    }
  }

  // Validate parameter types
  for (const [paramName, paramValue] of Object.entries(params)) {
    if (paramName in tool.parameters) {
      const paramDef = tool.parameters[paramName];
      const actualType = Array.isArray(paramValue) ? 'array' : typeof paramValue;

      if (paramDef.type !== actualType) {
        errors.push(
          `Parameter ${paramName} has wrong type. Expected ${paramDef.type}, got ${actualType}`,
        );
      }

      // Validate enum values
      if (paramDef.enum && !paramDef.enum.includes(String(paramValue))) {
        errors.push(`Parameter ${paramName} must be one of: ${paramDef.enum.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
