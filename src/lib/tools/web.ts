/**
 * Web Tools - Sandboxed HTTP/HTTPS requests with URL validation
 *
 * Importers/Callers: tools/registry.ts, ReAct agent runtime (Task 5)
 * Affected API: webFetchTool ToolDefinition with name 'web_fetch', parameters: { url, method, headers, body }, returns ToolResult with { success, output: { status, headers, body }, error }
 * Data Schemas: Uses Node.js https/http modules, validates URLs for allowed protocols, blocks private IPs
 * User Instruction: "web fetching"
 */

import https from 'https';
import http from 'http';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { ToolContext, ToolDefinition, ToolResult } from './types';

function isPrivateOrReservedAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const candidate = mappedIpv4 ?? normalized;

  if (isIP(candidate) === 4) {
    const [first, second] = candidate.split('.').map(Number);
    return first === 0 || first === 10 || first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first >= 224;
  }

  return candidate === '::' || candidate === '::1' ||
    candidate.startsWith('fc') || candidate.startsWith('fd') ||
    /^fe[89ab]/.test(candidate);
}

async function resolvePublicAddress(hostname: string): Promise<string> {
  if (hostname.toLowerCase() === 'localhost') {
    throw new Error('Access to a private or reserved IP address is not allowed');
  }

  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateOrReservedAddress(address))) {
    throw new Error('Access to a private or reserved IP address is not allowed');
  }

  return addresses[0].address;
}

function parseUrl(inputUrl: string): URL {
  const parsed = new URL(inputUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }
  return parsed;
}

export const webFetchTool: ToolDefinition = {
  name: 'web_fetch',
  description: 'Fetch content from web URLs with safety checks',
  parameters: {
    url: {
      type: 'string',
      description: 'URL to fetch',
      required: true,
    },
    method: {
      type: 'string',
      description: 'HTTP method (GET, POST, etc.)',
      required: false,
    },
    headers: {
      type: 'object',
      description: 'HTTP headers to send',
      required: false,
    },
    body: {
      type: 'string',
      description: 'Request body for POST/PUT methods',
      required: false,
    },
  },
  execute: async (params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> => {
    try {
      const urlParam = params.url as string;
      const method = (params.method as string) || 'GET';
      const headers = (params.headers as Record<string, string>) || {};
      const body = params.body as string | undefined;
      const parsedUrl = parseUrl(urlParam);
      const address = await resolvePublicAddress(parsedUrl.hostname);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      return new Promise((resolve) => {
        let settled = false;
        const finish = (result: ToolResult): void => {
          if (settled) return;
          settled = true;
          context.signal?.removeEventListener('abort', onAbort);
          resolve(result);
        };
        const req = client.request({
          hostname: address,
          servername: isHttps ? parsedUrl.hostname : undefined,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          headers: {
            Host: parsedUrl.host,
            'User-Agent': 'Type77-Sandboxed-Tools/1.0',
            ...headers,
          },
        }, (res) => {
          let responseBody = '';

          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => finish({
            success: true,
            output: {
              status: res.statusCode,
              headers: res.headers,
              body: responseBody,
            },
          }));
        });
        const onAbort = (): void => {
          req.destroy();
          finish({ success: false, error: 'Tool execution aborted' });
        };

        req.on('error', (err) => finish({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }));
        req.setTimeout(context.timeout ?? 30000, () => {
          req.destroy();
          finish({
            success: false,
            error: `Request timed out after ${context.timeout ?? 30000}ms`,
          });
        });
        context.signal?.addEventListener('abort', onAbort, { once: true });

        if (body) req.write(body);
        req.end();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
