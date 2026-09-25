/**
 * Importers/Callers: task execution API, delegation tools, runtime tests
 * Affected API: executeTask(taskId, options), createSubtask(parentId, input)
 * Data Schemas: Prisma Agent, Task, AgentLog; ReactAgent lifecycle events
 * User Instruction: "continue"
 */
import { prisma } from '../db/prisma';
import { ReactAgent } from '../agent/react-runtime';
import type { AgentPlanner, RunResult } from '../agent/types';
import type { SupportedProviderId } from '../providers/types';
import { SUPPORTED_PROVIDERS } from '../providers/registry';

export interface ExecuteTaskOptions {
  workspacePath: string;
  planner?: AgentPlanner;
  maxIterations?: number;
  timeout?: number;
}

export interface CreateSubtaskInput {
  title: string;
  description: string;
  assignedToId?: string;
  priority?: string;
}

export async function createSubtask(parentId: string, input: CreateSubtaskInput) {
  await prisma.task.findUniqueOrThrow({ where: { id: parentId } });

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      assignedToId: input.assignedToId,
      priority: input.priority ?? 'medium',
      parentId,
    },
  });
}

export async function executeTask(taskId: string, options: ExecuteTaskOptions): Promise<RunResult> {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { assignedTo: true },
  });
  if (!task.assignedTo) throw new Error('Task must be assigned to an agent before execution');

  const agent = task.assignedTo;
  if (!SUPPORTED_PROVIDERS.includes(agent.provider as SupportedProviderId) && !options.planner) {
    throw new Error(`Unsupported provider: ${agent.provider}`);
  }

  await prisma.$transaction([
    prisma.task.update({ where: { id: taskId }, data: { status: 'in_progress', result: null } }),
    prisma.agent.update({ where: { id: agent.id }, data: { status: 'working' } }),
  ]);

  const writeLog = async (type: string, content: string, metadata?: unknown): Promise<void> => {
    await prisma.agentLog.create({
      data: {
        agentId: agent.id,
        taskId,
        type,
        content,
        metadata: metadata === undefined ? null : JSON.stringify(metadata),
      },
    });
  };

  try {
    const providerSetting = await prisma.providerSetting.findUnique({
      where: { providerId: agent.provider },
    });

    if (!options.planner && (!providerSetting || !providerSetting.isActive)) {
      throw new Error(`No active ProviderSetting for provider: ${agent.provider}`);
    }

    let parsedCustomHeaders: Record<string, string> | undefined;
    if (providerSetting?.customHeaders) {
      try {
        parsedCustomHeaders = JSON.parse(providerSetting.customHeaders) as Record<string, string>;
      } catch {
        throw new Error(`Invalid customHeaders JSON for provider: ${agent.provider}`);
      }
    }

    const runtime = new ReactAgent({
      workspacePath: options.workspacePath,
      agentId: agent.id,
      planner: options.planner,
      maxIterations: options.maxIterations,
      timeout: options.timeout,
      providerId: options.planner ? undefined : (agent.provider as SupportedProviderId),
      model: options.planner ? undefined : agent.model,
      temperature: options.planner ? undefined : agent.temperature,
      systemPrompt: options.planner ? undefined : agent.systemPrompt,
      providerConfig: options.planner
        ? undefined
        : {
            apiKey: providerSetting?.apiKey ?? undefined,
            baseUrl: providerSetting?.baseUrl ?? undefined,
            defaultModel: providerSetting?.defaultModel ?? undefined,
            customHeaders: parsedCustomHeaders,
            providerId: agent.provider as SupportedProviderId,
            name: providerSetting?.name ?? 'provider',
          },
    });

    const result = await runtime.run(task.description, {
      onThought: (thought) => writeLog('thought', thought),
      onAction: (action) => writeLog('action', action.name, action),
      onObservation: (observation) => writeLog('observation', observation),
      onReflection: (reflection) => writeLog('reflection', reflection),
    });

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: result.success ? 'completed' : 'failed',
        result: result.success ? result.finalResult ?? '' : result.error ?? 'Task execution failed',
      },
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'failed', result: message },
    });
    throw error;
  } finally {
    await prisma.agent.update({ where: { id: agent.id }, data: { status: 'idle' } });
  }
}