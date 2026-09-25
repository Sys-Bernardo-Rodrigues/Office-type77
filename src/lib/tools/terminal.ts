/**
 * Terminal Tools - Sandboxed bash execution with timeout and safety filters
 *
 * Importers/Callers: tools/registry.ts, ReAct agent runtime (Task 5)
 * Affected API: executeBashTool ToolDefinition with name 'execute_bash', parameters: { command, timeout, cwd }, spawn-based execution with timeout and dangerous pattern blocking
 * Data Schemas: Uses Node.js child_process.spawn, returns ToolResult with { success, output: { exitCode, stdout, stderr }, error }
 * User Instruction: "safe bash execution timeouts"
 */

import { spawn } from 'child_process';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Dangerous patterns that should not be allowed in bash commands
 */
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//,  // rm -rf /
  /:\s*(){/,        // fork bomb
  /dd\s+if=\/dev\/random/,  // dd to destroy disk
];

/**
 * Check if command contains dangerous patterns
 */
function isSafeCommand(command: string): boolean {
  return !DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

export const executeBashTool: ToolDefinition = {
  name: 'execute_bash',
  description: 'Execute bash commands within the workspace with timeout protection',
  parameters: {
    command: {
      type: 'string',
      description: 'Bash command to execute',
      required: true,
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds (default: 30000)',
      required: false,
    },
    cwd: {
      type: 'string',
      description: 'Working directory for command execution (default: workspace)',
      required: false,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const command = params.command as string;
      const timeout = (params.timeout as number) || 30000;
      const cwd = (params.cwd as string) || context.workspacePath;

      if (!isSafeCommand(command)) {
        return {
          success: false,
          error: `Dangerous command pattern detected: ${command}`,
        };
      }

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let settled = false;

        const childProcess = spawn('bash', ['-c', command], {
          cwd,
          detached: true,
        });

        const stopProcess = (): void => {
          if (!childProcess.pid) return;
          try {
            process.kill(-childProcess.pid);
          } catch (error) {
            if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
          }
        };
        const finish = (result: ToolResult): void => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          context.signal?.removeEventListener('abort', onAbort);
          resolve(result);
        };
        const onAbort = (): void => {
          stopProcess();
          finish({ success: false, error: 'Tool execution aborted' });
        };
        const timer = setTimeout(() => {
          timedOut = true;
          stopProcess();
        }, timeout);
        context.signal?.addEventListener('abort', onAbort, { once: true });

        childProcess.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        childProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        childProcess.on('close', (code) => {
          if (timedOut) {
            finish({
              success: false,
              error: `Command timed out after ${timeout}ms`,
            });
          } else {
            finish({
              success: code === 0,
              output: {
                exitCode: code,
                stdout,
                stderr,
              },
            });
          }
        });

        childProcess.on('error', (err) => {
          finish({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
