import type { ProviderConfig, SupportedProviderId } from '../providers/types';

/**
 * ReAct Agent Runtime - Type Definitions
 *
 * Importers/Callers: src/lib/agent/react-runtime.ts, tests, external agent consumers
 * Affected API: ReactAgent, ReActStep, AgentState, Thought, Action, Observation, Reflection, RunOptions, RunResult
 * Data Schemas: Type definitions for ReAct loop execution and streaming lifecycle events
 * User Instruction: "ReAct loop with thought/action/observation/reflection, streaming events"
 */

export interface Thought {
  content: string;
  timestamp: number;
}

export interface Action {
  name: string;
  parameters: Record<string, unknown>;
}

export interface Observation {
  content: string;
  toolName?: string;
  success: boolean;
  timestamp: number;
}

export interface Reflection {
  content: string;
  shouldContinue: boolean;
  timestamp: number;
}

export interface ReActStep {
  stepNumber: number;
  thought: Thought;
  action?: Action;
  observation?: Observation;
  reflection?: Reflection;
}

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export interface AgentState {
  status: AgentStatus;
  currentStep: number;
  maxIterations: number;
  history: ReActStep[];
  finalResult?: string;
  error?: string;
}

export interface PlannerInput {
  prompt: string;
  stepNumber: number;
  history: ReActStep[];
  signal?: AbortSignal;
}

export interface PlannerDecision {
  thought: string;
  action: Action;
}

export interface AgentPlanner {
  plan(input: PlannerInput): Promise<PlannerDecision>;
}

export interface AgentConfig {
  workspacePath: string;
  agentId?: string;
  maxIterations?: number;
  timeout?: number;
  providerId?: SupportedProviderId;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  providerConfig?: Partial<ProviderConfig>;
  planner?: AgentPlanner;
}

export interface RunOptions {
  maxIterations?: number;
  onThought?: (thought: string) => void | Promise<void>;
  onAction?: (action: Action) => void | Promise<void>;
  onObservation?: (observation: string) => void | Promise<void>;
  onReflection?: (reflection: string) => void | Promise<void>;
}

export interface RunResult {
  success: boolean;
  steps: ReActStep[];
  finalResult?: string;
  error?: string;
  iterations: number;
}

export interface AgentEvent {
  type: 'thought' | 'action' | 'observation' | 'reflection' | 'complete' | 'error';
  data: unknown;
  timestamp: number;
}
