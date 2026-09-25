/**
 * ReAct Agent Runtime Tests
 *
 * Importers/Callers: src/lib/agent/react-runtime.ts
 * Affected API: ReactAgent class with run(), step(), getState(), stream events
 * Data Schemas: ReActStep, AgentState, Thought, Action, Observation types
 * User Instruction: "ReAct loop with thought/action/observation/reflection, streaming events"
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactAgent } from '../../src/lib/agent/react-runtime';

describe('ReAct Agent Runtime', () => {
  let agent: ReactAgent;
  let workspacePath: string;

  beforeEach(() => {
    workspacePath = mkdtempSync(join(tmpdir(), 'react-agent-'));
    writeFileSync(join(workspacePath, 'example.txt'), 'example');
    agent = new ReactAgent({
      workspacePath,
      maxIterations: 5,
      timeout: 30000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(workspacePath, { recursive: true, force: true });
  });

  it('creates agent with correct initial state', () => {
    expect(agent.getState()).toBeDefined();
    expect(agent.getState().status).toBe('idle');
  });

  it('runs agent with prompt and returns result', async () => {
    const result = await agent.run('Hello, what is 1+1?');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('steps');
    expect(Array.isArray(result.steps)).toBe(true);
  });

  it('awaits streaming callbacks in lifecycle order', async () => {
    const events: string[] = [];

    await agent.run('What is the capital of France?', {
      onThought: async () => {
        await Promise.resolve();
        events.push('thought');
      },
      onAction: async () => {
        await Promise.resolve();
        events.push('action');
      },
      onObservation: async () => {
        await Promise.resolve();
        events.push('observation');
      },
      onReflection: async () => {
        await Promise.resolve();
        events.push('reflection');
      },
    });

    expect(events).toEqual(['thought', 'action', 'observation', 'reflection']);
  });

  it('selects later actions from the complete observation history', async () => {
    const plan = vi
      .fn()
      .mockResolvedValueOnce({
        thought: 'Inspect the workspace first.',
        action: { name: 'list_directory', parameters: { path: '.' } },
      })
      .mockResolvedValueOnce({
        thought: 'Read the file discovered in the directory listing.',
        action: { name: 'read_file', parameters: { path: 'example.txt' } },
      })
      .mockResolvedValueOnce({
        thought: 'Return the file contents.',
        action: { name: 'finish', parameters: { result: 'example' } },
      });
    agent = new ReactAgent({
      workspacePath,
      maxIterations: 3,
      timeout: 30000,
      planner: { plan },
    });

    const result = await agent.run('Find and read the example file');

    expect(result.success).toBe(true);
    expect(result.steps.map((step) => step.action?.name)).toEqual([
      'list_directory',
      'read_file',
      'finish',
    ]);
    expect(plan).toHaveBeenCalledTimes(3);
    expect(plan.mock.calls[1][0].history[0].observation.content).toContain('example.txt');
    expect(plan.mock.calls[2][0].history[1].observation.content).toContain('example');
    expect(result.finalResult).toBe('example');
  });

  it('uses the configured provider to choose tools from prior observations', async () => {
    const responses = [
      {
        content: 'Inspect the workspace.',
        toolCalls: [{ id: 'call-1', name: 'list_directory', arguments: { path: '.' } }],
      },
      {
        content: 'Read the discovered file.',
        toolCalls: [{ id: 'call-2', name: 'read_file', arguments: { path: 'example.txt' } }],
      },
      { content: 'The file contains example.' },
    ];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const response = responses.shift();
      const request = JSON.parse(String(init?.body));

      if (responses.length === 1) {
        expect(request.messages.at(-1).content).toContain('example.txt');
      }
      if (responses.length === 0) {
        expect(request.messages.at(-1).content).toContain('example');
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: response?.content,
                tool_calls: response?.toolCalls?.map((call) => ({
                  id: call.id,
                  function: { name: call.name, arguments: JSON.stringify(call.arguments) },
                })),
              },
            },
          ],
          model: 'test-model',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    agent = new ReactAgent({
      workspacePath,
      maxIterations: 3,
      timeout: 30000,
      providerId: 'custom',
    });

    const result = await agent.run('Find and read the example file');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
    expect(result.steps.map((step) => step.action?.name)).toEqual([
      'list_directory',
      'read_file',
      'finish',
    ]);
    expect(result.finalResult).toBe('The file contains example.');
  });

  it('passes persisted agent provider settings to provider requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      expect(String(input)).toBe('https://provider.example/v1/chat/completions');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer secret-key');
      expect(new Headers(init?.headers).get('x-workspace')).toBe('type77');
      const request = JSON.parse(String(init?.body));
      expect(request.model).toBe('agent-model');
      expect(request.temperature).toBe(0.25);
      expect(request.messages[0]).toEqual({ role: 'system', content: 'Act as the saved agent.' });

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Configured response' } }],
          model: 'agent-model',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    agent = new ReactAgent({
      workspacePath,
      providerId: 'custom',
      model: 'agent-model',
      temperature: 0.25,
      systemPrompt: 'Act as the saved agent.',
      providerConfig: {
        apiKey: 'secret-key',
        baseUrl: 'https://provider.example/v1',
        customHeaders: { 'x-workspace': 'type77' },
      },
    });

    const result = await agent.run('Complete the configured task');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.finalResult).toBe('Configured response');
  });

  it('does not let onAction mutate the action that is executed', async () => {
    const result = await agent.run('What is the capital of France?', {
      onAction: (action) => {
        action.name = 'read_file';
        action.parameters = { path: '/nonexistent/path.txt' };
      },
    });

    expect(result.success).toBe(true);
    expect(result.finalResult).toBe('Paris');
    expect(result.steps[0].action).toEqual({
      name: 'finish',
      parameters: { result: 'Paris' },
    });
  });

  it('uses tools from the tool registry', async () => {
    const result = await agent.run('List files in current directory');
    expect(result).toHaveProperty('success');
    // Should have called at least one tool
    const hasToolCall = result.steps.some(
      (step) => step.action && step.action.name !== 'finish'
    );
    expect(hasToolCall).toBe(true);
  });

  it('handles tool execution errors gracefully', async () => {
    const result = await agent.run('Read file /nonexistent/path.txt');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(agent.getState().status).toBe('failed');
  });

  it('turns callback failures into a failed result', async () => {
    const result = await agent.run('What is the capital of France?', {
      onAction: async () => {
        throw new Error('stream disconnected');
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('stream disconnected');
    expect(agent.getState().status).toBe('failed');
  });

  it('fails when an iteration exceeds the configured timeout', async () => {
    agent = new ReactAgent({ workspacePath, timeout: 10 });

    const result = await agent.run('What is the capital of France?', {
      onThought: () => new Promise<void>(() => undefined),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Agent step timed out after 10ms');
    expect(agent.getState().status).toBe('failed');
  });

  it('does not continue a step after its callback is released following timeout', async () => {
    agent = new ReactAgent({ workspacePath, timeout: 10 });
    let releaseThought!: () => void;
    const blockedThought = new Promise<void>((resolve) => {
      releaseThought = resolve;
    });
    const onAction = vi.fn();
    const onObservation = vi.fn();
    const onReflection = vi.fn();

    const result = await agent.run('List files in current directory', {
      onThought: () => blockedThought,
      onAction,
      onObservation,
      onReflection,
    });
    releaseThought();
    await Promise.resolve();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Agent step timed out after 10ms');
    expect(onAction).not.toHaveBeenCalled();
    expect(onObservation).not.toHaveBeenCalled();
    expect(onReflection).not.toHaveBeenCalled();
  });

  it('reports iteration exhaustion as failure', async () => {
    const result = await agent.run('List files in current directory', { maxIterations: 1 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Maximum iterations reached');
    expect(result.finalResult).toBeUndefined();
    expect(agent.getState().status).toBe('failed');
  });

  it('rejects overlapping runs without corrupting the active run', async () => {
    let releaseFirstRun!: () => void;
    const firstRunBlocked = new Promise<void>((resolve) => {
      releaseFirstRun = resolve;
    });
    const firstRunStarted = Promise.withResolvers<void>();

    const firstRun = agent.run('What is the capital of France?', {
      onThought: async () => {
        firstRunStarted.resolve();
        await firstRunBlocked;
      },
    });
    await firstRunStarted.promise;

    const overlappingRun = await agent.run('Hello');
    expect(overlappingRun.success).toBe(false);
    expect(overlappingRun.error).toBe('Agent is already running');

    releaseFirstRun();
    const firstResult = await firstRun;
    expect(firstResult.success).toBe(true);
    expect(firstResult.finalResult).toBe('Paris');
    expect(agent.getState().status).toBe('completed');
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid maxIterations value %s',
    async (maxIterations) => {
      const result = await agent.run('What is the capital of France?', { maxIterations });

      expect(result.success).toBe(false);
      expect(result.error).toBe('maxIterations must be a positive finite integer');
      expect(result.steps).toHaveLength(0);
    },
  );

  it('returns deeply isolated state snapshots', async () => {
    await agent.run('What is the capital of France?');
    const snapshot = agent.getState();

    snapshot.history[0].thought.content = 'changed';
    snapshot.history[0].action!.parameters.result = 'changed';

    const current = agent.getState();
    expect(current.history[0].thought.content).not.toBe('changed');
    expect(current.history[0].action!.parameters.result).toBe('Paris');
  });
});