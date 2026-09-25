/**
 * Collaboration Tools - Multi-agent delegation and communication
 *
 * Importers/Callers: tools/registry.ts, ReAct agent runtime (Task 5)
 * Affected API: delegateTaskTool with name 'delegate_task', parameters: { task, agentType, context }; callMeetingTool with name 'call_meeting', parameters: { participants, topic, agenda }
 * Data Schemas: Returns ToolResult with { success, output: { taskId, status, result }, error }
 * User Instruction: "multi-agent delegation tools"
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

// Simple task queue for delegation (in production, this would be a proper message queue)
const taskQueue: Map<string, { task: string; status: 'pending' | 'running' | 'completed' | 'failed'; result?: unknown }> = new Map();

export const delegateTaskTool: ToolDefinition = {
  name: 'delegate_task',
  description: 'Delegate a task to another agent with specific capabilities',
  parameters: {
    task: {
      type: 'string',
      description: 'Task description for the delegate agent',
      required: true,
    },
    agentType: {
      type: 'string',
      description: 'Type of agent: researcher, coder, reviewer, general',
      required: false,
      enum: ['researcher', 'coder', 'reviewer', 'general'],
    },
    context: {
      type: 'object',
      description: 'Additional context for the task',
      required: false,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const task = params.task as string;
      const agentType = (params.agentType as string) || 'general';
      const taskContext = params.context as Record<string, unknown> | undefined;

      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Store task in queue
      taskQueue.set(taskId, {
        task,
        status: 'pending',
      });

      // In a real implementation, this would spawn a sub-agent or enqueue to a worker
      // For now, we simulate task creation
      const taskInfo = {
        taskId,
        description: task,
        agentType,
        workspacePath: context.workspacePath,
        context: taskContext || {},
        createdAt: new Date().toISOString(),
      };

      // Mark as running (simulated async execution)
      taskQueue.get(taskId)!.status = 'running';

      // Simulate completion after a short delay (in production, this would be actual delegation)
      const onAbort = (): void => {
        clearTimeout(completionTimer);
        const delegatedTask = taskQueue.get(taskId);
        if (delegatedTask) delegatedTask.status = 'failed';
      };
      const completionTimer = setTimeout(() => {
        context.signal?.removeEventListener('abort', onAbort);
        const delegatedTask = taskQueue.get(taskId);
        if (delegatedTask?.status === 'running') {
          delegatedTask.status = 'completed';
          delegatedTask.result = { status: 'delegated', taskId };
        }
      }, 100);
      context.signal?.addEventListener('abort', onAbort, { once: true });

      return {
        success: true,
        output: {
          taskId,
          status: 'delegated',
          task: taskInfo,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export const callMeetingTool: ToolDefinition = {
  name: 'call_meeting',
  description: 'Schedule or initiate a meeting between agents',
  parameters: {
    participants: {
      type: 'array',
      description: 'List of participant agent IDs',
      required: true,
      items: {
        type: 'string',
      },
    },
    topic: {
      type: 'string',
      description: 'Meeting topic or agenda item',
      required: true,
    },
    agenda: {
      type: 'array',
      description: 'Agenda items to discuss',
      required: false,
      items: {
        type: 'string',
      },
    },
    immediate: {
      type: 'boolean',
      description: 'Whether to start immediately (default: false)',
      required: false,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const participants = params.participants as string[];
      const topic = params.topic as string;
      const agenda = params.agenda as string[] | undefined;
      const immediate = (params.immediate as boolean) || false;

      if (!participants || participants.length === 0) {
        return {
          success: false,
          error: 'At least one participant is required',
        };
      }

      const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const meeting = {
        meetingId,
        topic,
        participants,
        agenda: agenda || [],
        scheduledAt: new Date().toISOString(),
        status: immediate ? 'in_progress' : 'scheduled',
        workspacePath: context.workspacePath,
      };

      // Simulate immediate meeting start
      if (immediate) {
        setTimeout(() => {
          // Meeting would be "in progress"
        }, 100);
      }

      return {
        success: true,
        output: {
          meetingId,
          status: immediate ? 'in_progress' : 'scheduled',
          meeting,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Helper to get task status (for monitoring delegated tasks)
 */
export function getTaskStatus(taskId: string): { status: string; result?: unknown } | null {
  const task = taskQueue.get(taskId);
  if (!task) return null;
  return { status: task.status, result: task.result };
}

/**
 * Helper to cancel a delegated task
 */
export function cancelTask(taskId: string): boolean {
  const task = taskQueue.get(taskId);
  if (!task) return false;
  task.status = 'failed';
  return true;
}
