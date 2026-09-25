/**
 * Importers/Callers: Vitest MCP suite; exercises the real stdio transport wiring
 * Affected API: src/lib/mcp/stdio-server.ts (spawned as a child process)
 * Data Schemas: MCP JSON-RPC initialize / tools/list requests and responses
 * User Instruction: "olhe o mcp e a documentação" — verifies Type77MCPServer is reachable
 *   over an actual MCP stdio transport, not just as an in-repo class
 */
import { describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const serverPath = path.join(repoRoot, 'src/lib/mcp/stdio-server.ts');

function callMcpServer(requests: object[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', serverPath], { cwd: repoRoot });
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP server timed out. stderr: ${stderr}`));
    }, 15000);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.split('\n').filter((line) => line.trim()).length >= 2) {
        clearTimeout(timer);
        child.kill();
        resolve(stdout);
      }
    });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });

    child.stdin.write(requests.map((req) => JSON.stringify(req)).join('\n') + '\n');
  });
}

describe('Type77 MCP stdio server', () => {
  it('completes the MCP handshake and lists the provider hub tools', async () => {
    const stdout = await callMcpServer([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'vitest-smoke', version: '0.0.1' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ]);

    const lines = stdout.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
    const initResponse = lines.find((line) => line.id === 1);
    const listResponse = lines.find((line) => line.id === 2);

    expect(initResponse.result.serverInfo.name).toBe('type77-provider-hub');
    expect(listResponse.result.tools.map((tool: { name: string }) => tool.name)).toContain('list_providers');
    expect(listResponse.result.tools.map((tool: { name: string }) => tool.name)).toContain('test_claude_connection');
  }, 20000);
});
