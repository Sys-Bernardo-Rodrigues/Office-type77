/**
 * Importers/Callers: Vitest runtime suite; compatibility surface for task/runtime consumers
 * Affected API: parseReActOutput(text), executeReActStep(action, context)
 * Data Schemas: ParsedReActOutput and tool Action values
 * User Instruction: "continue"
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { executeReActStep, parseReActOutput } from '../../src/lib/runtime/react-loop';

describe('ReAct compatibility runtime', () => {
  let workspacePath: string;

  beforeEach(() => {
    workspacePath = mkdtempSync(join(tmpdir(), 'type77-react-loop-'));
    writeFileSync(join(workspacePath, 'test.txt'), 'runtime content');
  });

  afterEach(() => {
    rmSync(workspacePath, { recursive: true, force: true });
  });

  it('parses thought and JSON tool action from provider text', () => {
    const parsed = parseReActOutput(
      'Thought: Need to read file\nAction: read_file({"path": "test.txt"})',
    );

    expect(parsed.thought).toBe('Need to read file');
    expect(parsed.action).toEqual({
      name: 'read_file',
      parameters: { path: 'test.txt' },
    });
  });

  it('parses a final answer as a finish action', () => {
    const parsed = parseReActOutput('Thought: Work is complete\nFinal Answer: Done');

    expect(parsed.action).toEqual({ name: 'finish', parameters: { result: 'Done' } });
  });

  it('executes parsed actions through the shared tool registry', async () => {
    const result = await executeReActStep(
      { name: 'read_file', parameters: { path: 'test.txt' } },
      { workspacePath, agentId: 'persistent-agent', timeout: 1000 },
    );

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ path: 'test.txt', content: 'runtime content' });
  });
});
