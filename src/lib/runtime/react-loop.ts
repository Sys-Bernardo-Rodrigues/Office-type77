/**
 * Importers/Callers: legacy text-output consumers, runtime tests, task orchestration
 * Affected API: parseReActOutput(text), executeReActStep(action, context)
 * Data Schemas: ReactAgent Action, ToolContext, and ToolResult
 * User Instruction: "continue"
 */
import type { Action } from '../agent/types';
import { executeTool } from '../tools/registry';
import type { ToolContext, ToolResult } from '../tools/types';

export interface ParsedReActOutput {
  thought: string;
  action?: Action;
}

export function parseReActOutput(text: string): ParsedReActOutput {
  const thought = text.match(/^Thought:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const finalAnswer = text.match(/^Final Answer:\s*([\s\S]+)$/m)?.[1]?.trim();
  if (finalAnswer !== undefined) {
    return { thought, action: { name: 'finish', parameters: { result: finalAnswer } } };
  }

  const actionMatch = text.match(/^Action:\s*([A-Za-z0-9_-]+)\((.*)\)\s*$/m);
  if (!actionMatch) return { thought };

  const parameters = JSON.parse(actionMatch[2]) as unknown;
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
    throw new Error('ReAct action parameters must be a JSON object');
  }

  return {
    thought,
    action: { name: actionMatch[1], parameters: parameters as Record<string, unknown> },
  };
}

export async function executeReActStep(action: Action, context: ToolContext): Promise<ToolResult> {
  if (action.name === 'finish') return { success: true, output: action.parameters.result };
  return executeTool(action.name, action.parameters, context);
}

export { ReactAgent } from '../agent/react-runtime';
export type { Action, AgentConfig, ReActStep, RunOptions, RunResult } from '../agent/types';
