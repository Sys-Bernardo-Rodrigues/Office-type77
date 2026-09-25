/**
 * Importers/Callers: Vitest runtime suite; exercises src/lib/runtime/task-manager.ts
 * Affected API: executeTask(taskId, options), createSubtask(parentId, input)
 * Data Schemas: Prisma Agent, Task, and AgentLog records
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../src/lib/db/prisma';
import { createSubtask, executeTask } from '../../src/lib/runtime/task-manager';

const createdAgentIds: string[] = [];
const createdTaskIds: string[] = [];

describe('Persistent Task Manager', () => {
  let workspacePath: string;

  beforeEach(async () => {
    workspacePath = mkdtempSync(join(tmpdir(), 'type77-task-manager-'));
    // Clean up any leftover ProviderSetting from previous test runs
    await prisma.providerSetting.deleteMany({ where: { providerId: 'custom' } });
  });

  afterEach(async () => {
    await prisma.agentLog.deleteMany({
      where: {
        OR: [
          { agentId: { in: createdAgentIds } },
          { taskId: { in: createdTaskIds } },
        ],
      },
    });
    await prisma.task.deleteMany({ where: { id: { in: createdTaskIds } } });
    await prisma.agent.deleteMany({ where: { id: { in: createdAgentIds } } });
    createdAgentIds.length = 0;
    createdTaskIds.length = 0;
    rmSync(workspacePath, { recursive: true, force: true });
  });

  it('executes an assigned task and persists lifecycle logs and final state', async () => {
    const agent = await prisma.agent.create({
      data: {
        name: 'Runtime Agent',
        role: 'Researcher',
        systemPrompt: 'Complete the assigned work.',
        provider: 'custom',
        model: 'test-model',
        avatar: 'runtime-agent',
      },
    });
    createdAgentIds.push(agent.id);

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    const result = await executeTask(task.id, {
      workspacePath,
      planner: {
        plan: async () => ({
          thought: 'I know the answer.',
          action: { name: 'finish', parameters: { result: 'Paris' } },
        }),
      },
    });

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    const logs = await prisma.agentLog.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(result.success).toBe(true);
    expect(persistedTask.status).toBe('completed');
    expect(persistedTask.result).toBe('Paris');
    expect(persistedAgent.status).toBe('idle');
    expect(logs.map((log) => log.type)).toEqual(['thought', 'action', 'observation', 'reflection']);
    expect(JSON.parse(logs[1].metadata!)).toEqual({
      name: 'finish',
      parameters: { result: 'Paris' },
    });
  });

  it('loads persisted ProviderSetting and passes provider/agent settings', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      expect(String(input)).toBe('https://provider.example/v1/chat/completions');

      const headers = new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer secret-key');
      expect(headers.get('x-workspace')).toBe('type77');

      const request = JSON.parse(String(init?.body));
      expect(request.model).toBe('model-from-agent');
      expect(request.temperature).toBe(0.42);

      // Planner produces system prompt as the first system message
      expect(request.messages[0]).toEqual({
        role: 'system',
        content: 'Act as the saved agent.',
      });

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Configured task result' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const agent = await prisma.agent.create({
      data: {
        name: 'Provider Agent',
        role: 'Researcher',
        systemPrompt: 'Act as the saved agent.',
        provider: 'custom',
        model: 'model-from-agent',
        temperature: 0.42,
        avatar: 'provider-agent',
      },
    });
    createdAgentIds.push(agent.id);

    await prisma.providerSetting.upsert({
      where: { providerId: 'custom' },
      update: {},
      create: {
        providerId: 'custom',
        name: 'Custom Provider Setting',
        apiKey: 'secret-key',
        baseUrl: 'https://provider.example/v1',
        defaultModel: 'model-from-provider',
        customHeaders: JSON.stringify({
          'x-workspace': 'type77',
        }),
        isActive: true,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    const result = await executeTask(task.id, { workspacePath });

    expect(result.success).toBe(true);
    expect(result.finalResult).toBe('Configured task result');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(persistedTask.status).toBe('completed');
    expect(persistedTask.result).toBe('Configured task result');

    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    expect(persistedAgent.status).toBe('idle');
  });

  it('fails when ProviderSetting is missing for provider', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('fetch should not be called');
    });

    const agent = await prisma.agent.create({
      data: {
        name: 'Missing ProviderSetting Agent',
        role: 'Researcher',
        systemPrompt: 'Complete the assigned work.',
        provider: 'custom',
        model: 'test-model',
        avatar: 'missing-provider-agent',
      },
    });
    createdAgentIds.push(agent.id);

    await prisma.providerSetting.deleteMany({ where: { providerId: 'custom' } });

    const providerSetting = await prisma.providerSetting.findUnique({ where: { providerId: 'custom' } });
    expect(providerSetting).toBeNull();

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    await expect(executeTask(task.id, { workspacePath })).rejects.toThrow('No active ProviderSetting');

    expect(fetchMock).not.toHaveBeenCalled();

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    // Error is now caught and task status updated to failed
    expect(persistedTask.status).toBe('failed');

    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    expect(persistedAgent.status).toBe('idle');
  });

  it('fails when ProviderSetting exists but is inactive', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('fetch should not be called');
    });

    const agent = await prisma.agent.create({
      data: {
        name: 'Inactive ProviderSetting Agent',
        role: 'Researcher',
        systemPrompt: 'Complete the assigned work.',
        provider: 'custom',
        model: 'test-model',
        avatar: 'inactive-provider-agent',
      },
    });
    createdAgentIds.push(agent.id);

    await prisma.providerSetting.upsert({
      where: { providerId: 'custom' },
      update: {},
      create: {
        providerId: 'custom',
        name: 'Inactive Provider Setting',
        apiKey: 'secret-key',
        baseUrl: 'https://provider.example/v1',
        defaultModel: 'model-from-provider',
        customHeaders: JSON.stringify({ 'x-workspace': 'type77' }),
        isActive: false,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    await expect(executeTask(task.id, { workspacePath })).rejects.toThrow('No active ProviderSetting');

    expect(fetchMock).not.toHaveBeenCalled();

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(persistedTask.status).toBe('failed');

    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    expect(persistedAgent.status).toBe('idle');
  });

  it('fails when ProviderSetting customHeaders JSON is malformed', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('fetch should not be called');
    });

    const agent = await prisma.agent.create({
      data: {
        name: 'Malformed customHeaders Agent',
        role: 'Researcher',
        systemPrompt: 'Complete the assigned work.',
        provider: 'custom',
        model: 'test-model',
        avatar: 'malformed-provider-agent',
      },
    });
    createdAgentIds.push(agent.id);

    await prisma.providerSetting.upsert({
      where: { providerId: 'custom' },
      update: {},
      create: {
        providerId: 'custom',
        name: 'Malformed Provider Setting',
        apiKey: 'secret-key',
        baseUrl: 'https://provider.example/v1',
        defaultModel: 'model-from-provider',
        customHeaders: '{not valid json',
        isActive: true,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    await expect(executeTask(task.id, { workspacePath })).rejects.toThrow('Invalid customHeaders JSON');

    expect(fetchMock).not.toHaveBeenCalled();

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(persistedTask.status).toBe('failed');

    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    expect(persistedAgent.status).toBe('idle');
  });

  it('fails and persists task status when provider request fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'provider down' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const agent = await prisma.agent.create({
      data: {
        name: 'Failing Provider Request Agent',
        role: 'Researcher',
        systemPrompt: 'Complete the assigned work.',
        provider: 'custom',
        model: 'model-from-agent',
        temperature: 0.1,
        avatar: 'failing-request-agent',
      },
    });
    createdAgentIds.push(agent.id);

    await prisma.providerSetting.upsert({
      where: { providerId: 'custom' },
      update: {},
      create: {
        providerId: 'custom',
        name: 'Failing Request Provider Setting',
        apiKey: 'secret-key',
        baseUrl: 'https://provider.example/v1',
        defaultModel: 'model-from-provider',
        customHeaders: JSON.stringify({ 'x-workspace': 'type77' }),
        isActive: true,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Answer a question',
        description: 'What is the capital of France?',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(task.id);

    const result = await executeTask(task.id, { workspacePath });

    expect(result.success).toBe(false);
    expect(result.error).toContain('provider down');
    expect(fetchMock).toHaveBeenCalled();

    const persistedTask = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(persistedTask.status).toBe('failed');

    const persistedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: agent.id } });
    expect(persistedAgent.status).toBe('idle');
  });

  it('creates delegated subtasks linked to their parent', async () => {
    const agent = await prisma.agent.create({
      data: {
        name: 'Delegating Agent',
        role: 'Manager',
        systemPrompt: 'Delegate work.',
        provider: 'custom',
        model: 'test-model',
        avatar: 'manager-agent',
      },
    });
    createdAgentIds.push(agent.id);

    const parent = await prisma.task.create({
      data: {
        title: 'Parent task',
        description: 'Coordinate the work.',
        assignedToId: agent.id,
      },
    });
    createdTaskIds.push(parent.id);

    const child = await createSubtask(parent.id, {
      title: 'Child task',
      description: 'Do one part.',
      assignedToId: agent.id,
      priority: 'high',
    });
    createdTaskIds.push(child.id);

    const tree = await prisma.task.findUniqueOrThrow({
      where: { id: parent.id },
      include: { subTasks: true },
    });

    expect(child.parentId).toBe(parent.id);
    expect(tree.subTasks).toHaveLength(1);
    expect(tree.subTasks[0].title).toBe('Child task');
    expect(tree.subTasks[0].priority).toBe('high');
  });
});
