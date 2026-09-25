import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { executeTool, listAvailableTools } from '../../src/lib/tools/registry';
import { getTaskStatus } from '../../src/lib/tools/collaboration';

describe('Sandboxed Tools Engine', () => {
  it('exposes core tools including filesystem, terminal, web and delegation', async () => {
    const tools = await listAvailableTools();
    const names = tools.map(t => t.name);

    expect(names).toContain('read_file');
    expect(names).toContain('write_file');
    expect(names).toContain('execute_bash');
    expect(names).toContain('delegate_task');
    expect(names).toContain('call_meeting');
  });

  it('validates workspace path sandboxing', async () => {
    const tools = await listAvailableTools();
    const readFileTool = tools.find(t => t.name === 'read_file');

    expect(readFileTool).toBeDefined();
    expect(readFileTool?.parameters).toHaveProperty('path');
    expect(readFileTool?.parameters.path).toHaveProperty('type', 'string');
  });

  it('rejects sibling paths whose names share the workspace prefix', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));
    const siblingPath = join(dirname(workspacePath), `${basename(workspacePath)}-outside`);

    try {
      writeFileSync(siblingPath, 'outside');
      const result = await executeTool(
        'read_file',
        { path: `../${basename(siblingPath)}` },
        { workspacePath, agentId: 'test', timeout: 1000 },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
      rmSync(siblingPath, { force: true });
    }
  });

  it('rejects symlinks that resolve outside the workspace', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));
    const outsidePath = join(dirname(workspacePath), `${basename(workspacePath)}-outside`);
    const linkPath = join(workspacePath, 'outside-link');

    try {
      writeFileSync(outsidePath, 'outside');
      symlinkSync(outsidePath, linkPath);

      const result = await executeTool(
        'read_file',
        { path: 'outside-link' },
        { workspacePath, agentId: 'test', timeout: 1000 },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
      rmSync(outsidePath, { force: true });
    }
  });

  it('does not create directories outside the workspace through a symlinked parent', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));
    const outsidePath = mkdtempSync(join(tmpdir(), 'type77-outside-'));
    const linkPath = join(workspacePath, 'outside-link');
    const escapedDirectory = join(outsidePath, 'created-outside');

    try {
      symlinkSync(outsidePath, linkPath);

      const result = await executeTool(
        'write_file',
        { path: 'outside-link/created-outside/file.txt', content: 'outside' },
        { workspacePath, agentId: 'test', timeout: 1000 },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
      expect(existsSync(escapedDirectory)).toBe(false);
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
      rmSync(outsidePath, { recursive: true, force: true });
    }
  });

  it('validates tool parameters before execution', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));

    try {
      const missingPath = await executeTool(
        'read_file',
        {},
        { workspacePath, agentId: 'test', timeout: 1000 },
      );
      const wrongContentType = await executeTool(
        'write_file',
        { path: 'file.txt', content: 42 },
        { workspacePath, agentId: 'test', timeout: 1000 },
      );

      expect(missingPath).toEqual({
        success: false,
        error: 'Missing required parameter: path',
      });
      expect(wrongContentType).toEqual({
        success: false,
        error: 'Parameter content has wrong type. Expected string, got number',
      });
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('writes nested files within the workspace', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));

    try {
      mkdirSync(join(workspacePath, 'existing'));
      const result = await executeTool(
        'write_file',
        { path: 'existing/nested/file.txt', content: 'inside' },
        { workspacePath, agentId: 'test', timeout: 1000 },
      );

      expect(result.success).toBe(true);
      expect(existsSync(join(workspacePath, 'existing/nested/file.txt'))).toBe(true);
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('aborts an in-flight bash process', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));
    const controller = new AbortController();

    try {
      const execution = executeTool(
        'execute_bash',
        { command: 'sleep 5' },
        { workspacePath, agentId: 'test', timeout: 10000, signal: controller.signal },
      );
      controller.abort();

      await expect(execution).resolves.toEqual({
        success: false,
        error: 'Tool execution aborted',
      });
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('does not complete delegated work after cancellation', async () => {
    const workspacePath = mkdtempSync(join(tmpdir(), 'type77-workspace-'));
    const controller = new AbortController();

    try {
      const result = await executeTool(
        'delegate_task',
        { task: 'Inspect the project' },
        { workspacePath, agentId: 'test', timeout: 1000, signal: controller.signal },
      );
      const taskId = (result.output as { taskId: string }).taskId;
      controller.abort();
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(getTaskStatus(taskId)?.status).toBe('failed');
    } finally {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    const result = await executeTool(
      'web_fetch',
      { url: 'http://localtest.me/' },
      { workspacePath: tmpdir(), agentId: 'test', timeout: 1000 },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('private or reserved IP address');
  });

  it('includes web fetching tool with URL validation', async () => {
    const tools = await listAvailableTools();
    const webTool = tools.find(t => t.name === 'web_fetch');

    expect(webTool).toBeDefined();
    expect(webTool?.parameters).toHaveProperty('url');
    expect(webTool?.parameters.url).toHaveProperty('type', 'string');
  });
});