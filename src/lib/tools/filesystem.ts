/**
 * Filesystem Tools - Sandboxed file operations
 *
 * Importers/Callers: tools/registry.ts
 * Affected API: read_file, write_file, list_directory tools
 * Data Schemas: ToolDefinition with path sandboxing
 * User Instruction: "workspace path sandboxing"
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Sanitize and validate path is within workspace
 */
function assertWithinWorkspace(candidate: string, workspace: string, filePath: string): void {
  const relative = path.relative(workspace, candidate);

  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path traversal detected: ${filePath} is outside workspace`);
  }
}

function sanitizePath(filePath: string, workspacePath: string): string {
  const normalizedWorkspace = path.resolve(workspacePath);
  const normalized = path.resolve(normalizedWorkspace, filePath);
  assertWithinWorkspace(normalized, normalizedWorkspace, filePath);
  return normalized;
}

async function validateRealPath(
  safePath: string,
  workspacePath: string,
  filePath: string,
  allowMissingFile = false,
): Promise<void> {
  const realWorkspace = await fs.realpath(workspacePath);
  let realTarget: string;

  try {
    realTarget = await fs.realpath(safePath);
  } catch (error) {
    if (!allowMissingFile || !(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      throw error;
    }

    let existingParent = path.dirname(safePath);
    const missingSegments = [path.basename(safePath)];

    while (true) {
      try {
        const realParent = await fs.realpath(existingParent);
        realTarget = path.join(realParent, ...missingSegments);
        break;
      } catch (parentError) {
        if (!(parentError instanceof Error && 'code' in parentError && parentError.code === 'ENOENT')) {
          throw parentError;
        }
        const parent = path.dirname(existingParent);
        if (parent === existingParent) throw parentError;
        missingSegments.unshift(path.basename(existingParent));
        existingParent = parent;
      }
    }
  }

  assertWithinWorkspace(realTarget, realWorkspace, filePath);
}

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read contents of a file within the workspace',
  parameters: {
    path: {
      type: 'string',
      description: 'Relative path to file within workspace',
      required: true,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const filePath = params.path as string;
      const safePath = sanitizePath(filePath, context.workspacePath);
      await validateRealPath(safePath, context.workspacePath, filePath);
      const content = await fs.readFile(safePath, 'utf-8');

      return {
        success: true,
        output: { path: filePath, content },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file within the workspace',
  parameters: {
    path: {
      type: 'string',
      description: 'Relative path to file within workspace',
      required: true,
    },
    content: {
      type: 'string',
      description: 'Content to write',
      required: true,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const filePath = params.path as string;
      const content = params.content as string;
      const safePath = sanitizePath(filePath, context.workspacePath);

      await validateRealPath(safePath, context.workspacePath, filePath, true);
      if (context.signal?.aborted) throw new Error('Tool execution aborted');
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      if (context.signal?.aborted) throw new Error('Tool execution aborted');
      await fs.writeFile(safePath, content, 'utf-8');

      return {
        success: true,
        output: { path: filePath, bytesWritten: content.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  description: 'List files and directories within the workspace',
  parameters: {
    path: {
      type: 'string',
      description: 'Relative path to directory within workspace (default: ".")',
      required: false,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const dirPath = (params.path as string) || '.';
      const safePath = sanitizePath(dirPath, context.workspacePath);
      await validateRealPath(safePath, context.workspacePath, dirPath);
      const entries = await fs.readdir(safePath, { withFileTypes: true });

      const items = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));

      return {
        success: true,
        output: { path: dirPath, items },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
