/**
 * Importers/Callers: `npm run mcp` CLI entrypoint, external MCP clients (Claude Desktop, Claude Code, etc.)
 *   configured via .mcp.json to spawn this file over stdio
 * Affected API: none exported — runs Type77MCPServer as a real MCP stdio server process
 * Data Schemas: MCPTool/MCPToolResult (src/lib/mcp/server.ts) mapped 1:1 onto the MCP
 *   ListToolsRequest/CallToolRequest wire schemas
 * User Instruction: "olhe o mcp e a documentação" — Type77MCPServer existed only as an in-repo
 *   class with no protocol transport; this wires it to @modelcontextprotocol/sdk over stdio so
 *   it can actually be attached to an external AI client, per the original request
 *   "crie um mcp que vai ser sempre mantido atualizado para podermos usar em outra ia se necessario"
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { Type77MCPServer } from './server';

const type77 = new Type77MCPServer();

const server = new Server(
  { name: 'type77-provider-hub', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: await type77.listTools(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  const result = await type77.callTool(name, (args ?? {}) as Record<string, unknown>);
  return { content: result.content, isError: result.isError };
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Type77 MCP server failed to start:', error);
  process.exit(1);
});
